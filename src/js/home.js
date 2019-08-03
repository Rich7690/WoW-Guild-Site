/*
import 'angular-promise-buttons';
import ngRoute from 'angular-route';
import 'angular-http-etag';
import ls from 'local-storage'
*/


angular.module('wowguildsite')
    .controller('HomeController', function($scope, $route, $routeParams, $location, $http) {
        $scope.$route = $route;
        $scope.$location = $location;
        $scope.$routeParams = $routeParams;
        const homeCtl = this;

        homeCtl.battletag = '';
        homeCtl.loaded = false;

        $http.get('api/get-user').then(function (response) {
            if (response.data && response.data.battletag) {
                homeCtl.battletag = response.data.battletag;
                homeCtl.loaded = true;
            }
        }, function (error) {
            homeCtl.loaded = true;
            if (error.status === 400) {
                homeCtl.error = error.data.error
            }
            else if(error.status === 401) {
                console.log("401 error");
                window.location.href = "/api/logout";
            }
            else {
                console.error(error);
                homeCtl.error = 'Failed to check logged in';
            }
            homeCtl.battletag = ''
        });
    })
    .config(function($routeProvider, $locationProvider, httpEtagProvider) {
        $routeProvider
            .when('/manage', {
                templateUrl: 'templates/manage.html',
                controller: 'ManageController'
            })
            .when('/summary', {
                templateUrl: 'templates/summary.html',
                controller: 'SummaryController'
            })
            .when('/summary/realm/:realm/guild/:guild', {
                templateUrl: 'templates/summary.html',
                controller: 'SummaryController'
            })
            .otherwise({
                templateUrl: 'templates/main.html'
            });
        httpEtagProvider
            .defineCache('persistentCache', {
                cacheService: 'localStorage'
            })
        // configure html5 to get links working on jsfiddle
        //$locationProvider.html5Mode(true);
    });