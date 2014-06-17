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

var cloneOp = function (op) {
    return { toInsert: op.toInsert, toRemove: op.toRemove, offset: op.offset };
};

var cycle = function () {
    var text = RandHtml.randomAscii(100);
    var htmlA = RandHtml.textToHtml(text);

    var htmlB = RandHtml.textToHtml(RandHtml.alterText(text, 10));
    var opAB = makeTextOperation(htmlA, htmlB);
    ValidateHtml.validate(htmlB);

    // It's possible that there is actually no difference, just continue in that case.
    if (!opAB) { return; }

    for (var i = 0; i < 100; i++) {

        var htmlC = RandHtml.textToHtml(RandHtml.alterText(text, 10));
        var opAC = makeTextOperation(htmlA, htmlC);

        var htmlC = patchString(htmlA, opAC.offset, opAC.toRemove, opAC.toInsert);
        ValidateHtml.validate(htmlC);

        if (!opAC) { continue; }

        var opBD = cloneOp(opAC);
        Otml.transform(opBD, opAB);

        if (!opBD) { continue; }

        var htmlD = patchString(htmlB, opBD.offset, opBD.toRemove, opBD.toInsert);

        try {
            ValidateHtml.validate(htmlD);
        } catch (e) {
            console.log("Original:\n");
            console.log(htmlA);
            console.log("\nOpAB:\n");
            console.log(opAB);
            console.log("\nStateB:\n");
            console.log(htmlB);
            console.log("\nOpAC:\n");
            console.log(opAC);
            console.log("\nStateC:\n");
            console.log(htmlC);
            console.log("\nOpBD:");
            console.log(opBD);
            console.log("\nFinal:");
            console.log(htmlD);
            throw e;
        }
    }
};

var main = module.exports.main = function (cycles, callback) {
    for (var i = 0; i < cycles; i++) {
        cycle();
    }
    callback();
};
