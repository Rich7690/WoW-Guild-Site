//import 'angular-promise-buttons';
//import 'angular-route';
//import ls from 'local-storage'
//import ngRoute from 'angular-route';

function get (key) {
    return JSON.parse(window.localStorage.getItem(key));
}

function set (key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

angular.module('wowguildsite')
    .controller('ManageController', ['$http', '$scope', '$routeParams', function ($http, $scope, $routeParams) {
        $scope.name = 'ManageController';
        $scope.params = $routeParams;

        $scope.data = {
            selectedGuild: {}
        };

        $scope.battletag = undefined;
        $scope.description = '';
        $scope.loaded = false;
        $scope.error = '';
        $scope.characters = [];
        $scope.tracked = [];
        $scope.untracked = [];
        $scope.classes = {};
        $scope.tablesLoaded = false;
        $scope.tablesLoading = false;
        $scope.toons = false;

        // Load cached results
        const cachedGuilds = get('Guilds');
        const cachedGuild = get('SelectedGuild');

        $scope.guilds = (cachedGuilds || []);
        $scope.data.selectedGuild = cachedGuild;

        const getCharacters = () => {
            $scope.loaded = false;
            return $http.get('api/get-characters').then(function (response) {
                const dupes = new Set();
                $scope.guilds = response.data.members.characters
                    .filter((char) => {
                        const filter = char.guild && !dupes.has(char.guild);
                        dupes.add(char.guild);
                        return filter;
                    })
                    .map((char) => {
                        return {guild: char.guild, realm: char.realm, display: `${char.guild} - ${char.realm}`};
                    });
                set('Guilds', $scope.guilds);
                $scope.loaded = true
            }, function (error) {

                if (error.status === 400) {
                    $scope.error = error.data.error
                } else {
                    console.error(error);
                    $scope.error = 'Failed to load WoW characters';
                }
            });
        };

        getCharacters();

        const getClasses = () => {
            return $http.get(`api/get-classes`).then((response) => {
                const classes = response.data.classes.classes;
                const map = {};
                for (const clazz of classes) {
                    map[clazz.id] = clazz.name;
                }
                $scope.classes = map;

            }, function (error) {
                $scope.classes = {};
                if (error.status === 400) {
                    $scope.error = error.data.error
                } else {
                    $scope.error = 'Failed to load classes';
                    console.error(error);
                }
            });
        };

        getClasses();


        $scope.guildChange = () => {
            $scope.error = undefined;
            if (!$scope.data.selectedGuild) {
                return;
            }
            const guild = $scope.data.selectedGuild;

            $http.get(`api/realm/${guild.realm}/guild/${guild.guild}`).then(function (response) {
                $scope.untracked = response.data.members;
                $scope.loaded = true;
                $scope.message = undefined;
            }, function (error) {

                if (error.status === 400) {
                    $scope.error = error.data.error
                }
                else if(error.status === 403) {
                    $scope.error = "You must be a GM or officer of the guild in order to manage it.";
                }
                else {
                    console.error(error);
                    $scope.error = 'Failed to load guild members';
                }
            });

        };

        if (cachedGuild) {
            $scope.guildChange();
        }

        $scope.activate = function (member) {
            return $http.post(`api/change-status`, {
                member: {
                    auditStatus: "ACTIVE",
                    name: member.name,
                    guildRealm: member.guildRealm,
                    guildName: member.guild
                }
            }).then((response) => {
                member.auditStatus = "ACTIVE";
                $scope.message = "Successfully activated member";

            }, function (error) {

                if (error.status === 400) {
                    $scope.error = error.data.error
                } else {
                    $scope.error = 'Failed to activate member';
                    console.error(error);
                }
            });
        };

        $scope.refresh = function () {
            return $http.post(`api/realm/${$scope.data.selectedGuild.realm}/guild/${$scope.data.selectedGuild.guild}/refresh`).then((response) => {
                $scope.message = "Refreshed guild members. Reloading...";
                $scope.guildChange();
            }, function (error) {
                if (error.status === 400) {
                    $scope.error = error.data.error
                } else {
                    $scope.error = 'Failed to refresh guild members';
                    console.error(error);
                }
            });
        };

        $scope.deactivate = function (member) {

            return $http.post(`api/change-status`, {
                member: {
                    auditStatus: "INACTIVE",
                    name: member.name,
                    guildRealm: member.guildRealm,
                    guildName: member.guild
                }
            }).then((response) => {
                member.auditStatus = "INACTIVE";
                $scope.message = "Successfully deactivated member";

            }, function (error) {

                if (error.status === 400) {
                    $scope.error = error.data.error
                } else {
                    $scope.error = 'Failed to deactivate member';
                    console.error(error);
                }
            });
        }
    }])
    .controller('SummaryController', ['$http', '$scope', "$routeParams", function ($http, $scope, $routeParams) {
        $scope.name = 'SummaryController';
        $scope.params = $routeParams;

        const realm = $routeParams.realm;
        const guild = $routeParams.guild;

        $scope.data = {
            selectedGuild: {}
        };

        $scope.battletag = undefined;
        $scope.description = '';
        $scope.loaded = false;
        $scope.error = '';
        $scope.characters = [];
        $scope.tracked = [];
        $scope.tablesLoaded = false;
        $scope.tablesLoading = false;
        $scope.toons = false;


        // Load cached results
        const cachedGuilds = get('Guilds');
        const cachedGuild = get('SelectedGuild');
        const cachedSummary = get("Summary");

        $scope.guilds = (cachedGuilds || [{default: true, display: "Choose a guild"}]);
        $scope.data.selectedGuild = (cachedGuild || $scope.guilds[0]);
        $scope.tracked = (cachedSummary || []);

        const getCharacters = () => {
            $scope.loaded = false;
            return $http.get('api/get-characters').then(function (response) {
                const dupes = new Set();
                const guilds = [{default: true, display: "Choose a guild"}];
                $scope.guilds = guilds.concat(response.data.members.characters
                    .filter((char) => {
                        const filter = char.guild && !dupes.has(char.guild);
                        dupes.add(char.guild);
                        return filter;
                    })
                    .map((char) => {
                        return {guild: char.guild, realm: char.realm, display: `${char.guild} - ${char.realm}`};
                    }));
                set('Guilds', $scope.guilds);
                $scope.loaded = true
            }, function (error) {

                if (error.status === 400) {
                    $scope.error = error.data.error;
                } else {
                    console.error(error);
                    $scope.error = 'Failed to load WoW characters';
                }
            });
        };

        getCharacters();

        $scope.guildChange = () => {
            $scope.error = undefined;
            const guild = $scope.data.selectedGuild;
            set("SelectedGuild", guild);
            if (!guild || guild.default) {
                return;
            }

            $scope.tablesLoaded = false;
            $scope.tablesLoading = true;
            $http.get(`api/get-summary/realm/${guild.realm}/guild/${guild.guild}`, {
                etagCache: 'persistentCache'
            }).then((response, itemCache) => {
                $scope.tracked = response.data.audit.audits;
                $scope.tablesLoaded = true;
                $scope.tablesLoading = false;
                itemCache.set($scope.tracked);
                set("Summary", $scope.tracked);

            }, function (error, itemCache) {
                if (error.status === 304) {
                    $scope.tracked = itemCache.get();
                    set("Summary", itemCache.get());
                    return;
                }
                $scope.tracked = [];
                $scope.untracked = [];
                $scope.tablesLoaded = true;
                $scope.tablesLoading = false;
                if (error.status === 400) {
                    $scope.error = error.data.error
                }
                else if (error.status === 404) {
                    $scope.error = "This guild does not have an audit summary";
                }
                else {
                    $scope.error = 'Failed to load guild members';
                    console.error(error);
                }
            }).ifCached(function (response) {
                //$scope.tracked = response.data;
                $scope.tablesLoaded = true;
                $scope.tablesLoading = false;
            });
        };

        if (cachedGuild) {
            $scope.guildChange();
        }
    }]);
