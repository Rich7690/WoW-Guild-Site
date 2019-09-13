//import 'angular-promise-buttons';

angular.module('wowguildsite', ['angularPromiseButtons', 'ngRoute', 'http-etag'])
  .controller('MainController', ['$http', function ($http ) {
    var mainCtl = this;

    mainCtl.data = {
      selectedToon: {},
      selectedSpecs: [],
      description: ''
    };

    mainCtl.battletag = undefined;
    mainCtl.description = '';
    mainCtl.loaded = false;
    mainCtl.error = '';
    mainCtl.characters = [];
    mainCtl.specs = [];

    const getToons = () => {
        $http.get('api/get-toons').then(function (response) {
            mainCtl.characters = response.data.characters;
            mainCtl.toons = true
        }, function (error) {

            if (error.status === 400) {
                mainCtl.error = error.data.error
            } else {
                console.error(error);
                mainCtl.error = 'Failed to load WoW characters';
            }
        });
    };

    getToons();

    $http.get('api/get-user').then(function (response) {
        if(response.data && response.data.battletag) {
            mainCtl.battletag = response.data.battletag;
            mainCtl.loaded = true;
        }
    }, function (error) {
        mainCtl.loaded = true;
        if (error.status === 400) {
            mainCtl.error = error.data.error
        } else {
            console.error(error);
            mainCtl.error = 'Failed to check logged in';
        }
      mainCtl.battletag = ''
    });

    mainCtl.toonChange = function () {
      mainCtl.specs = [];
      if (mainCtl.data.selectedToon) {
        mainCtl.spec = mainCtl.data.selectedToon.spec ? mainCtl.data.selectedToon.spec.name : [];

        const clazz = mainCtl.data.selectedToon.class;

        $http.get(`api/get-class/${clazz}`).then(function (response) {
          mainCtl.specs = response.data.specializations
        }, function (error) {
          console.error(error);
          mainCtl.error = 'Failed to get classes info';
        })
      }
    };

    mainCtl.submit = function ($event) {
        $event.preventDefault();
      return $http.post('api/submit-app', mainCtl.data).then(function (response) {
          mainCtl.message = "Successfully submitted your application. If we are interested, expect to hear back from us in a few days";

      }, function (error) {

        if (error.status === 400) {
          mainCtl.error = error.data.error
        } else {
          mainCtl.error = 'Failed to submit app';
          console.error(error);
        }
      });

    }
  }]);
