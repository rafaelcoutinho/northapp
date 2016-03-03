var jsonTransformQuery = function (data, headers) {
    data = angular.fromJson(data);
    var mainObj;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            mainObj = data[key];
            break;
        }
    }

    var resp = [];
    var cols = mainObj.columns;
    var records = mainObj.records;
    for (var i = 0; i < records.length; i++) {
        var recordsEntry = records[i];
        var entry = {};
        for (var j = 0; j < cols.length; j++) {
            var col = cols[j];
            var val = recordsEntry[j];
            entry[col] = val;
        }
        resp.push(entry);

    }


    return resp;
}
angular.module('north', ['ionic', 'ionic.service.core', 'north.services', 'north.controllers', 'ionic.service.push', 'ngCordova', 'ngResource'])
    .constant("appConfigs", {        
        // "backendSecure": "https://cumeqetrekking.appspot.com/",
        // "backend": "http://cumeqetrekking.appspot.com/",
        // "restBackend": "http://cumeqetrekking.appspot.com/rest",
        // "secureEndpointBackend":"https://cumeqetrekking.appspot.com/endpoints"
        
        "backendSecure": "http://192.168.33.105/northServer/api.php",
        "backend": "http://192.168.33.105/northServer/",
        "restBackend": "http://192.168.33.105/northServer/api.php",
        "secureEndpointBackend":"http://192.168.33.105/northServer/"
        // "backendSecure": "http://localhost/northServer/api.php",
        // "backend": "http://localhost/northServer/api.php"
    })
    .run(function ($ionicPlatform, $rootScope, $ionicLoading) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory
            // bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
            $rootScope.$on('loading:show', function () {
                $ionicLoading.show({
                    template: 'Carregando...'
                })
            });

            $rootScope.$on('loading:hide', function () {
                $ionicLoading.hide()
            });
            // kick off the platform web client
            try {
                Ionic.io();
                console.log("vai registrar pushes");
                $rootScope.onRegistered = function (pushToken) {
                    try {
                        console.log("Got Token onRegister: " + pushToken.token + " ");
                        var ionicUser = Ionic.User.current();
                        if (ionicUser.id) {
                            console.log("setting token to user");
                            ionicUser.addPushToken(pushToken.token);
                            ionicUser.save().then(function () {
                                console.log("token setado")
                            }, function (data) {
                                console.log("erro ao setar token!" + data)
                            });
                        }

                    } catch (e) {
                        console.log("erro regi " + e.message);
                    }

                };
                var push = new Ionic.Push({
                    "onNotification": function (notification) {
                        var payload = notification.payload;
                        console.log(notification, payload);
                        var idMsg = Math.round((Math.random() * 10000));
                        //					$cordovaLocalNotification.schedule({
                        //						id : idMsg,
                        //						title : notification.title,
                        //						text : notification.message,
                        //						icon : 'file://img/full.png',
                        //					}).then(function(result) {
                        //						console.log("resultado " + result);
                        //					});
                    },
                    "onRegister": $rootScope.onRegistered

                });

                push.register();
            } catch (e) {
                console.log("erro Ionic.Push " + e.message);

            }
        });

    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
        
        $httpProvider.interceptors.push(function ($rootScope, $q) {
            return {
                responseError: function (rejection) {
                    $rootScope.$broadcast('loading:hide')


                    return $q.reject(rejection);
                },
                requestError: function (rejection) {
                    $rootScope.$broadcast('loading:hide')

                    return $q.reject(rejection);
                },
                request: function (config) {
                    $rootScope.$broadcast('loading:show')
                    return config
                },
                response: function (response) {
                    $rootScope.$broadcast('loading:hide')

                    return response
                }
            }
        });
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl'
            })
            .state('app.etapas', {
                url: '/etapas',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapas.html'
                    }
                }
            })

            .state('app.etapa', {
                url: '/etapa/:id',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapa.html'
                    }
                }
            })

            .state('app.ranking', {
                url: '/ranking',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/ranking.html',
                        controller: 'RankingCtrl'
                    }
                }
            })

            .state('app.team', {
                url: '/team',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/team.html',
                        controller: 'TeamCtrl',
                    }
                }
            })

            .state('app.profile', {
                url: '/profile',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/profile.html',
                        controller: 'ProfileCtrl',
                    }
                }
            })

            .state('app.home', {
                url: '/home',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/highlights.html',
                        controller: 'HighlightCtrl'
                    }
                }
            })

        ;
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');
    });
