/*
 * Copyright (C) 2007-2008  Camptocamp
 *
 * This file is part of MapFish
 *
 * MapFish is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MapFish is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with MapFish.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * @requires widgets/print/Base.js
 */

Ext.namespace('mapfish.widgets');
Ext.namespace('mapfish.widgets.print');

/**
 * Class: mapfish.widgets.print.MultiPage
 * Automatically takes the layers from the given {<OpenLayers.Map>} instance.
 *
 * Inherits from:
 * - {<mapfish.widgets.print.Base>}
 */

/**
 * Constructor: mapfish.widgets.print.MultiPage
 *
 * Parameters:
 * config - {Object} Config object
 */

mapfish.widgets.print.MultiPage = Ext.extend(mapfish.widgets.print.Base, {
    /**
     * APIProperty: formConfig
     * {Object} - The configuration options passed to the form that edits the
     *            options common to every pages.
     *
     * Can contain additionnal items for custom fields. Their values will be
     * passed to the print service
     */
    formConfig: null,

    /**
     * APIProperty: columns
     * {Array} - The Additionnal columns for "per page" custom fields.
     */
    columns: null,

    /**
     * APIProperty: zoomToExtentEnabled
     * {boolean} - If true, the map will try to always show the selected page's
     *             extent by zooming out if necessary.
     */
    zoomToExtentEnabled: true,

    /**
     * Property: grid
     * {Ext.grid.EditorGridPanel} - The pages.
     */
    grid: null,

    /**
     * Property: printButton
     * {Ext.Button} - The "print" button.
     */
    printButton: null,

    /**
     * Property: freezeGeometryRefresh
     *
     * When true, the page's geometry is not refreshed when the data store is
     * modified.
     */
    freezeGeometryRefresh: false,

    /**
     * Method: fillComponent
     * Called by initComponent to create the component's sub-elements.
     */
    fillComponent: function() {
        //The inner border layout (extra level used because the
        //border layout doesn't allow to add components afterwards).
        var innerPanel = this.add({
            border: false,
            layout: 'border'
        });
        this.createGlobalForm(innerPanel);
        this.createGrid(innerPanel);
    },

    /**
     * Method: createGlobalForm
     *
     * Create the form for editing the global parameters.
     */
    createGlobalForm: function(innerPanel) {
        var formConfig = OpenLayers.Util.extend({
            region: 'south',
            bodyStyle: 'padding: 7px 0 0 0;',  //some space with the grid

            //by default, we don't want borders for the inner form
            border: false,
            bodyBorder: false
        }, this.formConfig);
        var formPanel = this.formPanel = new Ext.form.FormPanel(formConfig);

        var layout = this.createLayoutCombo("layout");
        if (this.config.layouts.length > 1) {
            layout.on('select', this.layoutChanged, this);
        }
        formPanel.add(layout);

        formPanel.add(this.createDpiCombo("dpi"));

        this.printButton = formPanel.addButton({
            text: OpenLayers.Lang.translate('mf.print.print'),
            scope: this,
            handler: this.print,
            disabled: true
        });

        innerPanel.add(formPanel);
    },

    /**
     * Method: createGrid
     *
     * Create the grid for editing pages' parameters.
     */
    createGrid: function(innerPanel) {
        var scale = this.createScaleCombo();
        scale.on('select', this.updateCurrentRectangle, this);

        var self = this;
        var columns = [
            {
                header: OpenLayers.Lang.translate('mf.print.scale'),
                dataIndex: 'scale',
                editor: scale,
                renderer: function(value) { return self.getScaleName(value); }
            }];

        var rotation = this.createRotationTextField();
        if (rotation != null) {
            columns.push({
                header: OpenLayers.Lang.translate('mf.print.rotation'),
                dataIndex: 'rotation',
                editor: rotation,
                id: this.id + '_rotation',
                hidden: !this.config.layouts[0].rotation
            });
        }

        if (this.columns) {
            columns.push.apply(columns, this.columns);
        }

        var pageFields = [];
        for (var i = 0; i < columns.length; ++i) {
            pageFields.push({
                name: columns[i].dataIndex
            });
        }
        var pages = new Ext.data.SimpleStore({
            fields: pageFields
        });

        var grid = this.grid = new Ext.grid.EditorGridPanel({
            region: 'center',
            border: false,
            id: this.getId() + 'Grid',
            autoScroll: true,
            enableColumnHide: false,
            enableHdMenu: false,
            store: pages,
            viewConfig: {
                forceFit: true,
                emptyText: OpenLayers.Lang.translate('mf.print.noPage')
            },
            sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
            clicksToEdit: 1,
            columns: columns,
            bbar: [
                {
                    text: OpenLayers.Lang.translate('mf.print.addPage'),
                    scope: this,
                    handler: this.addPage
                },
                {
                    text: OpenLayers.Lang.translate('mf.print.remove'),
                    scope: this,
                    handler: this.removeSelected,
                    id: this.getId() + "_remove",
                    disabled: true
                },
                {
                    text: OpenLayers.Lang.translate('mf.print.clearAll'),
                    scope: this,
                    handler: this.clearPages
                }
            ]
        });
        innerPanel.add(grid);

        grid.getSelectionModel().addListener('selectionchange', this.selectionChanged, this);
        grid.getStore().addListener('update', function (store, record, operation) {
            if (!this.freezeGeometryRefresh) {
                this.updateRectangle(record);
                this.updatePrintLayerStyle();
            }
        }, this);
        grid.getStore().addListener('remove', function (store, record, index) {
            this.layer.removeFeatures(record.data.rectangle);
            this.removeRotateHandle();
            if(store.getCount()==0) {
                this.printButton.disable();
            }
        }, this);
        grid.getStore().addListener('clear', function () {
            this.layer.removeFeatures(this.layer.features);
            this.printButton.disable();
        }, this);
    },

    /**
     * Method: selectionChanged
     *
     * Called when the selection changed in the grid. Will highlight the
     * selected page and make sure it's visible.
     */
    selectionChanged: function() {
        this.updatePrintLayerStyle();
        var removeButton = Ext.getCmp(this.getId() + '_remove');
        var selected = this.grid.getSelectionModel().getSelected();
        if (selected) {
            if(this.zoomToExtentEnabled) {
                var bounds = selected.data.rectangle.geometry.getBounds().clone();
                bounds.extend(this.map.getExtent());
                this.map.zoomToExtent(bounds);
            }
            removeButton.enable();

            var layoutData = this.getCurLayout();
            if (layoutData.rotation) {
                this.createRotateHandle(selected.data.rectangle);
            }
        } else {
            removeButton.disable();
        }
    },

    /**
     * Method: updatePrintLayerStyle
     *
     * Update the styles of the rectangle according the selected row in the
     * grid. Makes sure the selected one is on top.
     */
    updatePrintLayerStyle: function() {
        var selected = this.grid.getSelectionModel().getSelected();
        var theOne = null;
        for (var i = 0; i < this.layer.features.length; ++i) {
            var feature = this.layer.features[i];
            var isTheOne = feature.data.record == selected;
            feature.style = OpenLayers.Feature.Vector.style[isTheOne ? 'select' : 'default'];
            if (isTheOne && i != this.layer.features.length - 1) {
                theOne = feature;
                this.layer.removeFeatures(feature);
            }
        }
        if (theOne) this.layer.addFeatures(theOne);
        this.layer.redraw();
    },

    /**
     * Method: addPage
     *
     * Add a page that will fit the current extent.
     */
    addPage: function() {
        var layoutData = this.getCurLayout();
        var scale = this.fitScale(layoutData);
        var feature = this.createRectangle(this.map.getCenter(), scale, layoutData, 0);
        var newPage = {
            scale: scale,
            rotation: 0,
            rectangle: feature
        }
        for (var i = 0; i < this.columns.length; ++i) {
            var cur = this.columns[i].dataIndex;
            if (newPage[cur] == null) {
                newPage[cur] = "";
            }
        }

        var pages = this.grid.getStore();
        var record = new pages.recordType(newPage);
        pages.add(record);
        feature.data.record = record;
        this.grid.getSelectionModel().selectLastRow();
        this.printButton.enable();
    },

    /**
     * Method: clearPages
     *
     * Remove all the pages from the grid.
     */
    clearPages: function() {
        this.grid.stopEditing();
        this.grid.getStore().removeAll();
    },

    /**
     * Method: removeSelected
     *
     * Remove the selected page.
     */
    removeSelected: function() {
        this.grid.stopEditing();
        var record = this.grid.getSelectionModel().getSelected();
        this.grid.getStore().remove(record);
    },

    /**
     * Method: layoutChanged
     *
     * Called when the layout changes. Will re-create all the
     * rectangles and check if rotation is enabled.
     */
    layoutChanged: function() {
        this.grid.getStore().each(function(record) {
            this.updateRectangle(record);
        }, this);
        this.updatePrintLayerStyle();

        var cm = this.grid.getColumnModel();
        var rotationIndex = cm.getIndexById(this.id + '_rotation');
        if (rotationIndex >= 0) {
            var layoutData = this.getCurLayout();
            cm.setHidden(rotationIndex, !layoutData.rotation);
        }
    },

    /**
     * Method: updateCurrentRectangle
     *
     * Re-create the rectangle for the currently selected page.
     */
    updateCurrentRectangle: function() {
        this.updateRectangle(this.grid.getSelectionModel().getSelected());
        this.updatePrintLayerStyle();
    },

    /**
     * Method: updateRectangle
     *
     * Re-create the rectangle for the given record.
     *
     * Parameters:
     * record - {<Ext.data.Record>} The page's record.
     */
    updateRectangle: function(record) {
        this.grid.stopEditing();
        this.layer.removeFeatures(record.data.rectangle);
        var layoutData = this.getCurLayout();
        var scale = record.get('scale');
        var angle = layoutData.rotation ? record.get('rotation') : 0;
        var center = record.data.rectangle.geometry.getBounds().getCenterLonLat();
        var feature = this.createRectangle(center, scale, layoutData, angle);
        feature.data.record = record;
        record.data.rectangle = feature;

        var sm = this.grid.getSelectionModel();
        if (sm.getSelected() == record) {
            if (layoutData.rotation) {
                this.createRotateHandle(feature);
            } else {
                this.removeRotateHandle();
            }
        }
    },

    /**
     * Method: afterLayerCreated
     *
     * Called just after the layer has been created
     */
    afterLayerCreated: function() {
        if (this.grid.getStore().getCount() != 0) {
            this.grid.getStore().each(function(record) {
                this.layer.addFeatures(record.data.rectangle);
            }, this);
            this.updatePrintLayerStyle();

            var sm = this.grid.getSelectionModel();
            var selected = sm.getSelected();
            if (selected && this.getCurLayout().rotation) {
                this.createRotateHandle(selected.data.rectangle);
            }
        } else {
            this.addPage();
        }
    },

    /**
     * Method: pageRotateStart
     *
     * Called when the user starts to move the rotate handle.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The rotate handle.
     */
    pageRotateStart: function(feature) {
        mapfish.widgets.print.Base.prototype.pageRotateStart.call(this, feature);
        this.grid.stopEditing();
    },

    /**
     * Method: pageDragStart
     *
     * Called when we start editing a page.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The selected page.
     */
    pageDragStart: function(feature) {
        mapfish.widgets.print.Base.prototype.pageDragStart.call(this, feature);

        //make sure the dragged page is selected in the grid (no zooming)
        var prev = this.zoomToExtentEnabled;
        var sm = this.grid.getSelectionModel();
        if (sm.getSelected() != feature.data.record) {
            this.zoomToExtentEnabled = false;
            sm.selectRecords([feature.data.record]);
            this.zoomToExtentEnabled = prev;
        }
        this.grid.stopEditing();
    },

    /**
     * Method: getCurDpi
     *
     * Returns the user selected DPI.
     */
    getCurDpi: function() {
        var values = this.formPanel.getForm().getValues();
        return this.getDpiForName(values["dpi"]);
    },

    /**
     * Method: getCurLayoutName
     */
    getCurLayoutName: function() {
        var values = this.formPanel.getForm().getValues();
        return values['layout'];
    },

    /**
     * Method: getCurLayout
     *
     * Returns:
     * {Object} - The current layout config object
     */
    getCurLayout: function() {
        var layout = this.getCurLayoutName();
        return this.getLayoutForName(layout);
    },

    /**
     * Method: setCurRotation
     *
     * Called when the rotation of the current page has been changed.
     *
     * Parameters:
     * rotation - {float}
     */
    setCurRotation: function(rotation) {
        var selected = this.grid.getSelectionModel().getSelected();
        this.freezeGeometryRefresh = true;
        selected.set('rotation', rotation);
        this.freezeGeometryRefresh = false;
    },

    /**
     * Method: fillSpec
     * 
     * Add the page definitions and set the other parameters.
     *
     * Parameters:
     * printCommand - {<mapfish.PrintProtocol>} The print definition to fill.
     */
    fillSpec: function(printCommand) {
        var params = printCommand.spec;
        var layout = this.getCurLayout();

        //take care of the global values
        this.formPanel.getForm().items.each(function(cur) {
            params[cur.getName()] = cur.getValue();
        }, this);

        //take care of the per-page values
        this.grid.getStore().each(function(record) {
            var page = {};
            for (var key in record.data) {
                if (key == 'rectangle') {
                    page.center = this.getCenterRectangle(record.data.rectangle);
                } else if (key == 'rotation' && !layout.rotation) {
                    //no rotation
                } else {
                    page[key] = record.data[key];
                }
            }
            params.pages.push(page);
        }, this);
    }
});

Ext.reg('print-multi', mapfish.widgets.print.MultiPage);