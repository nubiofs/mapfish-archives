/*
 * Copyright (C) 2007  Camptocamp
 *
 * This file is part of CartoWeb
 *
 * CartoWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CartoWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with CartoWeb.  If not, see <http://www.gnu.org/licenses/>.
 */


dojo.provide("cartoweb.widgets.SearchXY");

dojo.require("cartoweb.MapControl");
dojo.require("dijit._Templated");
dojo.require("cartoweb.plugins.Searcher.XY");

dojo.declare("cartoweb.widgets.SearchXY", [cartoweb.MapControl, dijit._Templated], {

    templatePath: dojo.moduleUrl("cartoweb.widgets", "SearchXY.html"),
    searchUrl: null,
    radius: 100,        /* 100 meters by default */
    maxFeatures: 100,   /* 100 features maximum by default */
    onGotFeatures: null,

    mapCreated: function() {
        var cb = this.onGotFeatures ? this.onGotFeatures : null;
        this.query = new CartoWeb.Searcher.XY(this.map, this.radius, null, this.searchUrl, cb, this.maxFeatures);
    },

    toggle: function() {
        if (this.query.enabled) {
            this.query.disable();
        } else {
            this.query.enable();
        }
    }
});