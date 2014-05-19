
angular.module('slushSite', [
  'ngRoute',
  'generators',
  'slush-site-templates'
])
.config(function ($routeProvider) {
  'use strict';
  $routeProvider
    .when('/', {
      controller: 'GeneratorsCtrl',
      templateUrl: '/slush-site/generators/generators.html'
    })
    .otherwise({
      redirectTo: '/'
    });
});
