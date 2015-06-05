angular.module('generators')
  .controller('GeneratorsCtrl', function ($scope, $http, $log, $filter, $timeout) {
    'use strict';

    var PAGE_SIZE = 15;
    var URL = 'http://npmsearch.com/query';
    var KEYWORDS = ['slushgenerator'];
    var generators = [];

    $scope.page = 1;
    $scope.loaded = false;

    function loadAll (cb) {
      if ($scope.loaded) {
        return cb();
      }
      var data = {
        fields: 'name,keywords,rating,description,author,modified,homepage,version,license',
        q: 'keywords:' + KEYWORDS.join(','),
        size: PAGE_SIZE,
        start: 0
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

    function getPage () {
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
        if ($scope.page !== 1) {
          $scope.page = 1;
        } else {
          getPage();
        }
      }
    });

    $scope.getPage = function (p) {
      if (!p) {
        p = 1;
      } else if (p > $scope.totalPages) {
        p = $scope.totalPages;
      }
      $scope.page = p;
    };

    $scope.getPages = function () {
      var PAGES_TO_SHOW = 9,
          pages = [],
          from = 1,
          to = PAGES_TO_SHOW;


      if ($scope.totalPages <= PAGES_TO_SHOW) {
        from = 1;
        to = $scope.totalPages;
      } else {
        from = $scope.page - Math.floor(PAGES_TO_SHOW / 2);
        to = $scope.page + Math.floor(PAGES_TO_SHOW / 2);

        if (from < 1) {
          to += Math.abs(from) + 1;
          from = 1;
        } else if (to > $scope.totalPages) {
          from -= to - $scope.totalPages;
          to = $scope.totalPages;
        }
      }

      for (var i = from; i <= to; i++) {
        pages.push(i);
      }
      return pages;
    };
  });
