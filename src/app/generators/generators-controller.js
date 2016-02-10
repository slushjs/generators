'use strict';
var url = require('url');
var angular = require('angular');
var GeneratorsCtrl = 'GeneratorsCtrl';

module.exports = GeneratorsCtrl;

angular.module(GeneratorsCtrl, [])
  .controller(GeneratorsCtrl, [
    '$scope',
    '$http',
    '$log',
    '$filter',
    '$timeout',
    function ($scope, $http, $log, $filter, $timeout) {
      var PAGE_SIZE = 20;
      var URL = 'http://npmsearch.com/query';
      var KEYWORDS = ['slushgenerator'];
      var generators = [];

      $scope.page = 1;
      $scope.loaded = false;

      function loadAll(cb) {
        if ($scope.loaded) {
          return cb();
        }
        var data = {
          fields: 'name,keywords,rating,description,author,modified,homepage,version,license',
          q: 'keywords:' + KEYWORDS.join(','),
          size: PAGE_SIZE,
          start: 0,
          sort: 'rating:desc'
        };
        $http.get(URL, {params: data})
          .success(function (res) {
            var hits = res.results || [];
            generators.push.apply(generators, hits);
            $scope.hits = generators.slice();
            $scope.total = $scope.hits.length;
            $scope.loaded = true;
            $timeout(cb, 0);
            if (res.total > generators.length) {
              data.size = res.total - PAGE_SIZE;
              data.start = PAGE_SIZE;
              $http.get(URL, {params: data})
                .success(function (res) {
                  generators.push.apply(generators, res.results);
                  $scope.total = generators.length;
                });
            }
          })
          .catch(function (err) {
            $log.error(err);
          });
      }

      function getPage() {
        loadAll(function () {
          var hits = $scope.search ? $filter('filter')(generators, $scope.search) : generators;
          $scope.total = hits.length;
          $scope.hits = hits.slice(($scope.page - 1) * PAGE_SIZE, $scope.page * PAGE_SIZE);
        });
      }

      $scope.unique = function (arr) {
        var result = [];
        for (var i = 0, len = arr.length; i < len; i++) {
          if (result.indexOf(arr[i]) < 0) {
            result.push(arr[i]);
          }
        }
        return result;
      };

      $scope.$watch('total', function (newVal) {
        if (typeof newVal === 'number') {
          $scope.totalPages = Math.ceil(newVal / PAGE_SIZE);
        }
      });

      $scope.$watch('page', function () {
        getPage();
      });

      $scope.$watch('search', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if ($scope.page === 1) {
            getPage();
          } else {
            $scope.page = 1;
          }
        }
      });

      $scope.hasHomepage = function (hit) {
        return hit.homepage && hit.homepage[0] && hit.homepage[0] !== 'undefined';
      };

      $scope.getRepoName = function (hit) {
        var repo = hit.homepage && hit.homepage[0];
        if (repo && repo !== 'undefined') {
          var parsed = url.parse(repo);
          if (parsed && parsed.pathname) {
            return parsed.pathname.slice(1).replace(/(\.git|#.*)$/, '');
          }
        }
        return hit.author[0] + '/' + hit.name[0];
      };

      $scope.getPage = function (p) {
        if (!p) {
          p = 1;
        } else if (p > $scope.totalPages) {
          p = $scope.totalPages;
        }
        $scope.page = p;
      };

      $scope.getPages = function () {
        var PAGES_TO_SHOW = 9;
        var pages = [];
        var fromPage = 1;
        var toPage = PAGES_TO_SHOW;

        if ($scope.totalPages <= PAGES_TO_SHOW) {
          fromPage = 1;
          toPage = $scope.totalPages;
        } else {
          fromPage = $scope.page - Math.floor(PAGES_TO_SHOW / 2);
          toPage = $scope.page + Math.floor(PAGES_TO_SHOW / 2);

          if (fromPage < 1) {
            toPage += Math.abs(fromPage) + 1;
            fromPage = 1;
          } else if (toPage > $scope.totalPages) {
            fromPage -= toPage - $scope.totalPages;
            toPage = $scope.totalPages;
          }
        }

        for (var i = fromPage; i <= toPage; i++) {
          pages.push(i);
        }
        return pages;
      };
    }
  ]);
