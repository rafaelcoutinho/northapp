angular.module('north', ['ionic', 'ionic.service.core','north.services', 'north.controllers', 'ionic.service.push', 'ngCordova'])

    .run(function ($ionicPlatform, $rootScope) {
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

    .config(function ($stateProvider, $urlRouterProvider) {
        
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
             .state('app.etapaGrid', {
                url: '/etapa/:id/grid',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapa.grid.html'
                    }
                }
            })
            .state('app.etapaLocation', {
                url: '/etapa/:id/location',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapa.location.html'
                    }
                }
            })
            .state('app.etapaResults', {
                url: '/etapa/:id/results',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapa.results.html'
                    }
                }
            })
            .state('app.etapaPictures', {
                url: '/etapa/:id/pictures',

                views: {
                    'menuContent': {
                        controller: 'EtapasCtrl',
                        templateUrl: 'templates/etapa.pictures.html'
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
