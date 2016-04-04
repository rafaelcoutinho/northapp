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
        "backendSecure": "https://cumeqetrekking.appspot.com/",
        "backend": "http://cumeqetrekking.appspot.com/",
        "enhancedRestBackend": "http://cumeqetrekking.appspot.com/app/enhanced",
        "openRestBackend": "http://cumeqetrekking.appspot.com/app/rest",
        "secureEndpointBackend": "https://cumeqetrekking.appspot.com/endpoints"
        
        // "backendSecure": "http://192.168.33.105/northServer/apiPub.php",
        // "backend": "http://192.168.33.105/northServer/",
        // "restBackend": "http://192.168.33.105/northServer/apiPub.php",
        // "secureEndpointBackend": "http://192.168.33.105/northServer/"

    })
    .run(function ($ionicPlatform, $rootScope, $ionicLoading, $location, $anchorScroll, $ionicHistory, $ionicSideMenuDelegate) {
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
                var push = new Ionic.Push({
                    "debug": false,
                    "onNotification": function (notification) {
                        var payload = notification.payload;
                        console.log(notification, payload);
                    },
                    "onRegister": function (token) {
                        console.log("Device token: '" + token.token);
                        push.saveToken(token);
                    }
                });

                push.register(function (token) {

                });


            } catch (e) {
                console.log("erro Ionic.Push " + e.message);

            }
            $ionicPlatform.registerBackButtonAction(function (event) {              
               event.preventDefault();
               console.log($ionicSideMenuDelegate.isOpenLeft())
                if ($ionicHistory.backView() == null) {
                    if ($ionicSideMenuDelegate.isOpen()) {
                        navigator.app.exitApp(); //<-- remove this line to disable the exit
                    }else{
                        $ionicSideMenuDelegate.toggleLeft();
                    }
                }
                else {
                    navigator.app.backHistory();
                }
            }, 1000);
        });
        //permite fazer scroll com route
        $rootScope.$on('$routeChangeSuccess', function (newRoute, oldRoute) {
            if ($location.hash()) $anchorScroll();
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
                        controller: 'EtapaCtrl',
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
