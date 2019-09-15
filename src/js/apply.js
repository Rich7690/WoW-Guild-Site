//import 'angular-promise-buttons';

angular.module('wowguildsite', ['angularPromiseButtons', 'ngRoute', 'http-etag'])
    .controller('MainController', ['$http', function ($http) {
        var mainCtl = this;

        mainCtl.data = {
            selectedToon: {},
            selectedSpecs: [],
            description: ''
        };

        mainCtl.page = undefined;
        mainCtl.apps = [];
        mainCtl.battletag = undefined;
        mainCtl.description = '';
        mainCtl.loaded = false;
        mainCtl.error = '';
        mainCtl.characters = [];
        mainCtl.specs = [];
        mainCtl.statusMap = {
            'REJECTED': "Sorry, we have decided to pass on your application at this time. Please feel free to apply on another character or apply on this one again in 3 months.",
            'CREATED': "Pending review from our recruitment team.",
            'ACCEPTED': "We have decided to move forward with your application. Expect a Battle.net invitation soon. " +
                "Also, feel free to join the discord in the mean time and message an admin if you'd like: https://discord.gg/abtrUHp",
            'REVOKED': "You have decided to revoke this application from consideration."
        };
        mainCtl.applyNavClass = 'nav-link';
        mainCtl.appNavClass = 'nav-link';
        mainCtl.appsLoaded = false;

        mainCtl.changePage = function(page, refresh) {
            mainCtl.page = page;
            switch (page) {
                case 'apps':
                    mainCtl.applyNavClass = 'nav-link';
                    mainCtl.appNavClass = 'nav-link active';
                    if(refresh) {
                        mainCtl.appsLoaded = false;
                        getApps();
                    }
                    break;
                case 'apply':
                    mainCtl.applyNavClass = 'nav-link active';
                    mainCtl.appNavClass = 'nav-link';
                    if(refresh) {
                        getToons();
                    }
                    break
            }
        };
        mainCtl.changePage('apply');

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

        $http.get('api/get-user').then(function (response) {
            if (response.data && response.data.battletag) {
                mainCtl.battletag = response.data.battletag;
            }
            mainCtl.loaded = true;
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

        getToons();

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
                mainCtl.message = "Successfully submitted your request. Please check back on the Applications page to track the status of your request. " +
                    "If we are interested, expect to hear back from us in a few days.";

            }, function (error) {

                if (error.status === 400) {
                    mainCtl.error = error.data.error
                } else {
                    mainCtl.error = 'Failed to submit app';
                    console.error(error);
                }
            });
        };

        const getApps = function () {
            $http.get('api/my-apps').then(function (response) {
                mainCtl.appsLoaded = true;
                if (response.data.apps && response.data.apps.length > 0) {
                    mainCtl.apps = response.data.apps;
                    mainCtl.changePage('apps');
                }
            }, function (error) {
                mainCtl.appsLoaded = true;
                if (error.status === 400) {
                    mainCtl.error = error.data.error
                } else {
                    console.error(error);
                    mainCtl.error = 'Failed to load applications. Try refreshing the page.';
                }
            });
        };

        getApps();


    }]);
