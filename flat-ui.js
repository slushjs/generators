'use strict';
var fs = require('fs');
var join = require('path').join;
var less = require('less');

var flatUiPath = join('node_modules', 'flat-ui', 'less');

var variables = fs.readFileSync(join(flatUiPath, 'variables.less'), 'utf8');
variables = variables.replace('@font-size-base:    		18px;', '@font-size-base:    		14px;');
fs.writeFileSync(join(flatUiPath, 'variables-slush.less'), variables, 'utf8');

var flatUi = fs.readFileSync(join(flatUiPath, 'flat-ui.less'), 'utf8');
flatUi = flatUi.replace('@import "fonts";', '// @import "fonts";');
flatUi = flatUi.replace('@import "variables";', '@import "variables-slush";');

less.render(flatUi, {
  filename: join(flatUiPath, 'flat-ui.less'),
  compress: process.argv.indexOf('--compress') !== -1
}, function (err, out) {
  if (err) {
    console.error(err.stack || err);
    process.exit(1);
  }
  console.log(out.css.replace(/\.\.\/fonts\//g, 'fonts/'));
});
