/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Otml = require('./Otaml');
var ValidateHtml = require('./ValidateHtml');
var RandHtml = require('./RandHtml');

var makeTextOperation = function(oldval, newval) {
    if (oldval === newval) { return; }

    var begin = 0;
    for (; oldval[begin] === newval[begin]; begin++) ;

    var end = 0;
    for (var oldI = oldval.length, newI = newval.length;
         oldval[--oldI] === newval[--newI];
         end++) ;

    if (end >= oldval.length - begin) { end = oldval.length - begin; }
    if (end >= newval.length - begin) { end = newval.length - begin; }

    return {
        offset: begin,
        toRemove: oldval.length - begin - end,
        toInsert: newval.slice(begin, newval.length - end),
    };
};

var patchString = function (oldString, offset, toRemove, toInsert)
{
    return oldString.substring(0, offset) + toInsert + oldString.substring(offset + toRemove);
};

var cycle = function () {
    var text = RandHtml.randomAscii(3000);
    var htmlA = RandHtml.textToHtml(text);

    var htmlB = RandHtml.textToHtml(RandHtml.alterText(text, 10));
    var opAB = makeTextOperation(htmlA, htmlB);

    // It's possible that there is actually no difference, just continue in that case.
    if (!opAB) { return; }

    for (var i = 0; i < 100; i++) {

        var htmlC = RandHtml.textToHtml(RandHtml.alterText(text, 10));
        var opAC = makeTextOperation(htmlA, htmlC);

        if (!opAC) { continue; }

        var opAD = Otml.transform(opAC, opAB);

        if (!opAD) { continue; }

        var htmlD = patchString(htmlA, opAD.offset, opAD.toRemove, opAD.toInsert);

        ValidateHtml.validate(htmlD);
    }
};

var main = module.exports.main = function (cycles, callback) {
    for (var i = 0; i < cycles; i++) {
        cycle();
    }
    callback();
};
