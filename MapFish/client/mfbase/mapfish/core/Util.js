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

/**
 * Namespace: mapfish.Util
 * Utility functions
 */
mapfish.Util = {};

/**
 * APIFunction: mapfish.Util.sum
 * Return the sum of the elements of an array.
 */
mapfish.Util.sum = function(array) {
    for (var i=0, sum=0; i < array.length; sum += array[i++]);
    return sum;
};

/**
 * APIFunction: mapfish.Util.max
 * Return the max of the elements of an array.
 */
mapfish.Util.max = function(array) {
    return Math.max.apply({}, array);
};

/**
 * APIFunction: mapfish.Util.min
 * Return the min of the elements of an array.
 */
mapfish.Util.min = function(array) {
    return Math.min.apply({}, array);
};

/**
 * Function: getIconUrl
 * Builds the URL for a layer icon, based on a WMS GetLegendGraphic request.
 *
 * Parameters:
 * wmsUrl - {String} The URL of a WMS server.
 * options - {Object} The options to set in the request:
 *                    'layer' - the name of the layer for which the icon is requested (required)
 *                    'rule' - the name of a class for this layer (this is set to the layer name if not specified)
 *                    'format' - "image/png" by default
 *                    ...
 *
 * Returns:
 * {String} The URL at which the icon can be found.
 */
mapfish.Util.getIconUrl = function(wmsUrl, options) {
    if (!options.layer) {
        OpenLayers.Console.warn(
            'Missing required layer option in mapfish.Util.getIconUrl');
        return '';
    }
    if (!options.rule) {
        options.rule = options.layer;
    }
    var url = wmsUrl + ((wmsUrl.indexOf('?') != (wmsUrl.length - 1)) ? '?' : '');
    var options = OpenLayers.Util.extend({
        layer: "",
        rule: "",
        service: "WMS",
        version: "1.1.1",
        request: "GetLegendGraphic",
        format: "image/png",
        width: 16,
        height: 16
    }, options);
    options = OpenLayers.Util.upperCaseObject(options);
    return url + OpenLayers.Util.getParameterString(options);
};


/**
 * APIFunction: mapfish.Util.arrayEqual
 * Compare two arrays containing primitive types.
 *
 * Parameters:
 * a - {Array} 1st to be compared.
 * b - {Array} 2nd to be compared.
 *
 * Returns:
 * {Boolean} True if both given arrays contents are the same (elements value and type).
 */
mapfish.Util.arrayEqual = function(a, b) {
    if(a == null || b == null)
        return false;
    if(typeof(a) != 'object' || typeof(b) != 'object')
        return false;
    if (a.length != b.length)
        return false;
    for (var i = 0; i < a.length; i++) {
        if (typeof(a[i]) != typeof(b[i]))
            return false;
        if (a[i] != b[i])
            return false;
    }
    return true;
};

/**
 * Function: isIE7
 *
 * Returns:
 * {Boolean} True if the browser is Internet Explorer V7
 */
mapfish.Util.isIE7 = function () {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("msie 7") > -1;
};

/**
 * Function: relativeToAbsoluteURL
 *
 * Parameters:
 * source - {String} the source URL
 *
 * Returns:
 * {String} An absolute URL
 */
mapfish.Util.relativeToAbsoluteURL = function(source) {
    if (/^\w+:/.test(source) || !source) {
        return source;
    }

    var h = location.protocol + "//" + location.host;
    if (source.indexOf("/") == 0) {
        return h + source;
    }

    var p = location.pathname.replace(/\/[^\/]*$/, '');
    return h + p + "/" + source;
};
