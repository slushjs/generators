'use strict';
var angular = require('angular');
var ngRoute = require('angular-route');
var GeneratorsCtrl = require('./generators/generators-controller.js');
var generatorsTemplate = require('./generators/generators-template.js');

angular.module('slushSite', [
  ngRoute,
  GeneratorsCtrl,
  generatorsTemplate
])
.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/', {
      controller: GeneratorsCtrl,
      templateUrl: generatorsTemplate
    })
    .otherwise({
      redirectTo: '/'
    });
}]);
