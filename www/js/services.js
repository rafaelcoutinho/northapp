var isTooOld = function (cacheInfo) {
    return cacheInfo.updated < (new Date().getTime() - (1000 * 60 * 60 * 24 * 7));
}
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


    .factory('EtapasService', function ($http, $localStorage, $resource, appConfigs, $q) {

        var etapaResource = $resource(appConfigs.enhancedRestBackend + "/Etapa/:id", {}, {
            query: {
                isArray: true,
                cache: true,
                // transformResponse: jsonTransformQuery
            },
            get: {
                cache: true
            },
            getGrid: {
                isArray: false,
                methdo: "GET",
                url: appConfigs.enhancedRestBackend + "/Etapa/:id/GridInfo"

            }
        });



        return {
            clear: function () {
                delete $localStorage.northApp_etapas;
                delete $localStorage.northApp_etapas_details;
            },
            getGrid: etapaResource.getGrid,
            query: etapaResource.query,
            queryCached: function () {
                var deferred = $q.defer();

                if ($localStorage.northApp_etapas && !isTooOld($localStorage.northApp_etapas)) {
                    deferred.resolve($localStorage.northApp_etapas.data);
                } else {
                    etapaResource.query({}, function (response) {
                        $localStorage.northApp_etapas = {
                            data: response,
                            updated: new Date().getTime()
                        }
                        deferred.resolve($localStorage.northApp_etapas.data);
                    }, function (error) {
                        deferred.reject(error);
                    })
                }
                return deferred.promise;
            },
            get: function (obj) {
                if (!$localStorage.northApp_etapas_details) {
                    $localStorage.northApp_etapas_details = {};
                }
                var deferred = $q.defer();
                var l = $localStorage.northApp_etapas_details[obj.id];
                if (l && !isTooOld(l)) {
                    deferred.resolve(l.data);
                } else {
                    etapaResource.get(obj, function (resp) {
                        if (resp.id_Local && resp.id_Local != -1) {
                            //só cacheia se estiver ok
                            $localStorage.northApp_etapas_details[obj.id] = { data: resp, updated: new Date().getTime() };
                        }
                        deferred.resolve(resp);
                    }, function (resp) {
                        deferred.reject(resp);
                    });
                }
                return deferred.promise;
            }
        }


    })
    .service('EquipesService', ['$http', '$q', '$resource', 'appConfigs', function ($http, $q, $resource, appConfigs) {
        return $resource(appConfigs.openRestBackend + '/Equipe/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            },
            getMyEquipe: {
                isArray: false,
                url: appConfigs.enhancedRestBackend + '/Competidor/:id/Equipe',

            }
        });

    }])
    .service('LocationService', ['$http', '$q', '$resource', 'appConfigs', function ($http, $q, $resource, appConfigs) {
        return $resource(appConfigs.openRestBackend + '/Local/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            }
        });

    }])
    .service('HighlightService', ['$http', '$q', '$resource', 'appConfigs', function ($http, $q, $resource, appConfigs) {

        return $resource(appConfigs.openRestBackend + '/Destaque/:id', {}, {
            query: {
                isArray: true,
                cache: true,
                transformResponse: jsonTransformQuery
            }
        });

    }])

    .service('UserService', function ($http, $localStorage, appConfigs, $resource, $q) {
        return $resource(appConfigs.secureEndpointBackend + '/User', {},
            {

                validate: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + '/Register'
                    // url: 'http://localhost/northServer/userRegister.php'
                },
                rememberPwd: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + "/senha/LembrarSenha"
                }
            }
            );
    })
    .service('loginService', function ($http, $localStorage, appConfigs, $resource, $q, UserService, $log) {

        return {
            startPwdRecovery: function (email) {
                UserService.rememberPwd({ },{ email: email });
            },
            saveUser: function (user) {
                var deferred = $q.defer();
                var me = this;
                //TODO algum tipo controle de login
                UserService.save({ id: user.id }, user, function (response) {
                    me.setUserLocally(user);
                    deferred.resolve(response.data);
                }, function (response) {
                    deferred.reject(response);
                }
                    );
                return deferred.promise;
            },
            login: function (email, pwd) {
                var deferred = $q.defer();

                var data = {
                    email: email,
                    password: pwd
                };

                $http.post(appConfigs.secureEndpointBackend + "/Login", data)
                    .then(function successCallback(response) {
                        //TODO algum tipo controle de login
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
                } else {
                    Ionic.Auth.logout();
                }
            },
            validateNewUser: function (aUser, headers) {
                var deferred = $q.defer();

                var me = this;
                UserService.validate(headers, aUser, function (data) {
                    if (aUser.id == null) {
                        aUser.id = data.id;
                    }
                    me.setUserLocally(data);
                    deferred.resolve($localStorage.northApp_user);
                }, function (response) {
                    var data = response.data;

                    deferred.reject(data);

                });
                return deferred.promise;
            },
            ionicLogin: function (user) {
                var deferred = $q.defer();
                var ioData = {
                    email: user.email,
                    password: "default",
                    custom: user
                }

                var authProvider = 'basic';
                var authSettings = { 'remember': true };

                var authSuccess = function (newuser) {
                    $log.log("authSuccess " + newuser);
                    // user was authenticated, you can get the authenticated user
                    // with Ionic.User.current();
                    iouser = Ionic.User.current();
                    for (var key in user) {
                        $log.log($key, user[key]);
                        if (key != 'password' && key != 'email') {
                            $log.log("setando")
                            iouser.set(key, user[key]);
                        }
                        iouser.save();
                    }

                    deferred.resolve(iouser);
                };
                var authFailure = function (errors) {
                    $log.log("authFailure ");
                    for (var err in errors) {
                        // check the error and provide an appropriate message
                        // for your application
                        $log.log("Erro " + err);
                    }
                    deferred.reject(errors);
                };
                var login = function () {
                    Ionic.Auth.login(authProvider, authSettings, ioData)
                        .then(authSuccess, authFailure);
                };
                login();
                return deferred.promise;
            },
            ionicSignUp: function (user) {
                var deferred = $q.defer();
                var ioData = {
                    email: user.email,
                    password: "default",
                    custom: user
                }
                var signupSuccess = function (arg) {
                    console.log("Ionic signup " + arg);
                    iouser = Ionic.User.current();
                    deferred.resolve(iouser);
                }
                var signupFailure = function (arg) {
                    console.log("Ionic signup error " + arg)
                    deferred.reject(arg);
                }
                Ionic.Auth.signup(ioData).then(signupSuccess, signupFailure);
                return deferred.promise;
            },
            reloadIonicUser: function (user) {
                try {
                    var iouser = Ionic.User.current();
                    if (iouser.isAuthenticated()) {
                        $log.log("iouser " + iouser);

                    } else {
                        $log.log("Ionic user not found, trying to log user in ");
                        var me = this;
                        this.ionicLogin(user).then(function () {
                            $log.log("ok");
                        }, function (err) {
                            $log.log("usuário nao existe na plataforma ionic, criando agora");
                            me.ionicSignUp(user).then(function () {
                                $log.log("Usuarip ok");
                            }, function (err) {
                                $log.log("Não foi possivel cadastrar usuario");
                            });
                        })
                    }
                } catch (e) {
                    console.log("erro buscando usuario " + e.message)

                }
            },
            getUser: function () {
                var user = $localStorage.northApp_user;
                var iouser = Ionic.User.current();
                $log.log("Ionic user " + iouser)
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