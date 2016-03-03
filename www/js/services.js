angular.module('north.services', ['ionic', 'ngCordova', 'ngStorage', 'ngResource'])

    .factory('WeatherService', function ($http, $localStorage, $resource, appConfigs, $q) {
        return {
            getPerCoords: function (lat, lng, date) {
                var now = new Date();
                var diff = date - now.getTime();
                var deferred = $q.defer();
                diff = Math.ceil(diff / (24 * 60 * 60 * 1000));
                setTimeout(function () {
                    if (diff < 0 || diff > 16) {
                        deferred.reject("Etapa no passado OU mais de 16 dias de hoje.");
                        return;
                    }
                    $http({
                        method: 'GET',
                        url: 'http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + lat + '&lon=' + lng + '&cnt=' + diff + '&mode=json&appid=a6914b6f4ef75969ead626f11b294bf5&lang=pt'
                    }).then(function successCallback(response) {
                        var weather = response.data.list[diff - 1].weather[0];
                        weather.wicon = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
                        deferred.resolve(weather);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                }, 1);

                return deferred.promise;

            }
        }


    }).service('modalService', ['$modal',
        function ($modal) {

            var modalDefaults = {
                backdrop: true,
                keyboard: true,
                modalFade: true,
                templateUrl: '/app/partials/modal.html'
            };

            var modalOptions = {
                closeButtonText: 'Close',
                actionButtonText: 'OK',
                headerText: 'Proceed?',
                bodyText: 'Perform this action?'
            };

            this.showModal = function (customModalDefaults, customModalOptions) {
                if (!customModalDefaults) customModalDefaults = {};
                customModalDefaults.backdrop = 'static';
                return this.show(customModalDefaults, customModalOptions);
            };

            this.show = function (customModalDefaults, customModalOptions) {
                //Create temp objects to work with since we're in a singleton service
                var tempModalDefaults = {};
                var tempModalOptions = {};

                //Map angular-ui modal custom defaults to modal defaults defined in service
                angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

                //Map modal.html $scope custom properties to defaults defined in service
                angular.extend(tempModalOptions, modalOptions, customModalOptions);

                if (!tempModalDefaults.controller) {
                    tempModalDefaults.controller = function ($scope, $modalInstance) {
                        $scope.modalOptions = tempModalOptions;
                        $scope.modalOptions.ok = function (result) {
                            $modalInstance.close(result);
                        };
                        $scope.modalOptions.close = function (result) {
                            $modalInstance.dismiss('cancel');
                        };
                    }
                }

                return $modal.open(tempModalDefaults).result;
            };

        }])


    .factory('EtapasService', function ($http, $localStorage, $resource, appConfigs) {


        return $resource(appConfigs.restBackend + "/Etapa/:id", {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            }
        });



    })

    .service('LocationService', ['$http', '$q', '$resource', 'appConfigs', function ($http, $q, $resource, appConfigs) {
        return $resource(appConfigs.restBackend + '/Local/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            }
        });

    }])
    .service('HighlightService', ['$http', '$q', '$resource', 'appConfigs', function ($http, $q, $resource, appConfigs) {

        return $resource(appConfigs.restBackend + '/Destaque/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            }
        });

    }])
    .service('GridService', function ($http, $localStorage, $resource) {
        return $resource('http://www.mocky.io/v2/56c3e97b110000201d2824a2',
            {},
            {
                query: {
                    isArray: false
                }
            }

            );

    })
    .service('UserService', function ($http, $localStorage, appConfigs, $resource, $q) {
        return $resource(appConfigs.restBackend + '/Trekker/:id', {},
            {
                byEmail: {
                    method: "GET",
                    isArray: true,
                    transformResponse: jsonTransformQuery,
                    url: appConfigs.restBackend + '/Trekker/?filter=email,eq,:email'
                }
            }
            );
    })
    .service('loginService', function ($http, $localStorage, appConfigs, $resource, $q, UserService) {

        return {
            login: function (email, pwd) {
                var deferred = $q.defer();

                var data = {
                    email: email,
                    password: pwd
                };

                $http.post(appConfigs.secureEndpointBackend + "/Login", data)
                    .then(function successCallback(response) {
                        deferred.resolve(response.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                return deferred.promise;
            },
            setUserLocally: function (aUser) {

                $localStorage.northApp_user = aUser;
                if (aUser != null) {
                    this.reloadIonicUser(aUser);
                }
            },
            setUser: function (aUser) {
                var deferred = $q.defer();

                var me = this;
                aUser = UserService.save(aUser, function (data) {
                    if (aUser.id == null) {
                        aUser.id = data.id;
                    }
                    me.setUserLocally(data);
                    deferred.resolve($localStorage.northApp_user);
                }, function (response) {
                    var data = response.data;
                    if (data.errorMsg.indexOf("Duplicate") > -1) {
                        deferred.reject("dupe");
                    } else {
                        deferred.reject(data);
                    }
                });
                return deferred.promise;
            },
            reloadIonicUser: function (user) {
                try {

                    var ionicUser = Ionic.User.load(user.id).then(function (data) {
                        console.log(data + "Carregou usuario do ionico " + JSON.stringify(ionicUser));

                    }, function (erro) {
                        try {
                            console.log("Nao existe vai criar " + erro);
                            ionicUser = Ionic.User.current();
                            console.log("pegou current " + ionicUser);
                            // if the user doesn't have an id, you'll need to give
                            // it one.
                            if (!ionicUser.id) {
                                ionicUser.id = user.id + "";

                            } else {
                                console.log("na verdade existe id: " + ionicUser.id);

                            }
                            ionicUser.set('name', user.name);
                            ionicUser.set('email', user.email);
                            ionicUser.set('image', user.image);

                            console.log("id: " + ionicUser.id);

                            ionicUser.save().then(function (a) {
                                console.log("salvou no ionic " + a)
                            }, function (err) {
                                console.log("falhou para salvar no ionic " + err)
                            });
                        } catch (e) {
                            console.log("Erro criando" + e.message);
                        }
                    });
                    ;

                } catch (e) {
                    console.log("erro buscando usuario " + e.message)

                }
            },
            getUser: function () {
                console.log($localStorage.northapp)
                var user = $localStorage.northApp_user;

                return user;
            },
            getUserID: function () {
                return this.getUser() == null ? null : this.getUser().id;
            },
            isLoggedIn: function () {
                return ($localStorage.northApp_user) ? $localStorage.northApp_user : false;
            }
        };
    })