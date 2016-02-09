'use strict';
var angular = require('angular');
var template = require('./generators.html');

module.exports = __filename;

angular.module(__filename, [])
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put(__filename, template);
  }]);
