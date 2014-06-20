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

var Common = require('./Common');
var Sha = require('./SHA256');

/**
 * Expand an operation to cover enough HTML that any naive transformation
 * will result in correct HTML.
 */
var expandOp = module.exports.expandOp = function (html, op) {
//return op;
    if (Common.PARANOIA && typeof(html) !== 'string') { throw new Error(); }
    var ctx = {};
    for (;;) {
        var elem = Common.getPreviousElement(html, ctx);
        // reached the end, this should not happen...
        if (!elem) { throw new Error(JSON.stringify(op)); }
        if (elem.openTagIndex <= op.offset) {
            var endIndex = html.indexOf('>', elem.closeTagIndex) + 1;
            if (!endIndex) { throw new Error(); }
            if (endIndex >= op.offset + op.toRemove) {
                var newHtml = Common.patchString(html, op.offset, op.toRemove, op.toInsert);
                var newEndIndex = endIndex - op.toRemove + op.toInsert.length;
                var out = {
                    offset: elem.openTagIndex,
                    toRemove: endIndex - elem.openTagIndex,
                    toInsert: newHtml.substring(elem.openTagIndex, newEndIndex)
                };
                if (Common.PARANOIA) {
                    var test = Common.patchString(html, out.offset, out.toRemove, out.toInsert);
                    if (test !== newHtml) {
                        throw new Error(test + '\n\n\n' + newHtml + '\n\n' + elem.openTagIndex + '\n\n' + newEndIndex);
                    }
                    if (out.toInsert[0] !== '<') { throw new Error(); }
                    if (out.toInsert[out.toInsert.length - 1] !== '>') { throw new Error(); }
                }
                return out;
            }
        }
        //console.log(elem);
    }
};

var operationsEqual = function (opA, opB) {
    return (opA.offset === opB.offset &&
        opA.toRemove === opB.toRemove &&
        opA.toInsert === opB.toInsert);
};

var hash = function (text) {
    return Sha.hex_sha256(text);
};

var transformB = function (html, toTransform, transformBy) {

    var transformByEndOffset = transformBy.offset + transformBy.toRemove;
    if (toTransform.offset > transformByEndOffset) {
        // simple rebase
        toTransform.offset -= transformBy.toRemove;
        toTransform.offset += transformBy.toInsert.length;
        return toTransform;
    }

    var toTransformEndOffset = toTransform.offset + toTransform.toRemove;

    if (transformBy.offset > toTransformEndOffset) {
        // we're before them, no transformation needed.
        return toTransform;
    }

    // so we overlap, we're just going to revert one and apply the other.
    // The one which affects more content should probably be applied.
    var toRevert = toTransform;
    var toApply = transformBy;
    if        (toTransform.toInsert.length > transformBy.toInsert.length) {
        toRevert = transformBy;
        toApply = toTransform;
    } else if (toTransform.toInsert.length < transformBy.toInsert.length) {
        // fall through
    } else if (toTransform.toRemove > transformBy.toRemove) {
        toRevert = transformBy;
        toApply = toTransform;
    } else if (toTransform.toRemove < transformBy.toRemove) {
        // fall through
    } else {
        if (operationsEqual(toTransform, transformBy)) { return null; }
        
    }

    if (transformBy.offset > transformBy.offset) {
        // transformBy has deleted our offset.
        
    }

    // if toTransform 
};

var transform = module.exports.transform = function (html, toTransform, transformBy) {

    toTransform = Common.cloneOp(toTransform);
    toTransform = expandOp(html, toTransform);

    transformBy = Common.cloneOp(transformBy);
    transformBy = expandOp(html, transformBy);

    if (toTransform.offset >= transformBy.offset) {
        if (toTransform.offset >= transformBy.offset + transformBy.toRemove) {
            // simple rebase
            toTransform.offset -= transformBy.toRemove;
            toTransform.offset += transformBy.toInsert.length;
            return toTransform;
        }

        // They deleted our begin offset...

        var toTransformEndOffset = toTransform.offset + toTransform.toRemove;
        var transformByEndOffset = transformBy.offset + transformBy.toRemove;
        if (transformByEndOffset >= toTransformEndOffset) {
            // They also deleted our end offset, lets forget we wrote anything because
            // whatever it was, they deleted it's context.
            return null;
        }

        // goto the end, anything you deleted that they also deleted should be skipped.
        var newOffset = transformBy.offset + transformBy.toInsert.length;
        toTransform.toRemove = 0; //-= (newOffset - toTransform.offset);
        if (toTransform.toRemove < 0) { toTransform.toRemove = 0; }
        toTransform.offset = newOffset;
        if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
            return null;
        }
        return toTransform;
    }
    if (toTransform.offset + toTransform.toRemove < transformBy.offset) {
        return toTransform;
    }
    toTransform.toRemove = transformBy.offset - toTransform.offset;
    if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
        return null;
    }
    return toTransform;
};
