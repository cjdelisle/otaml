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
var Fs = require('fs');
var nThen = require('nthen');

var cycles = 100;
if (process.argv.indexOf('--cycles') === 1) {
    cycles = process.argv[process.argv.indexOf('--cycles')+1];
}

var nt = nThen(function (waitFor) {

    Fs.readdir('./src', waitFor(function (err, ret) {
        if (err) { throw err; }
        ret.forEach(function (file) {
           if (/_test\.js/.test(file)) {
               nt = nt(function (waitFor) {
                   var test = require('./src/'+file);
                   console.log("Running Test " + file);
                   test.main(cycles, waitFor());
               }).nThen;
           }
        });
    }));

}).nThen;
