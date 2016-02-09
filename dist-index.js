'use strict';
var fs = require('fs');
var join = require('path').join;

var index = fs.readFileSync(join('src', 'app', 'index.html'), 'utf8');

fs.writeFileSync(join('dist', 'index.html'), index.replace(/\.(js|css)/g, '.min.$1'), 'utf8');
