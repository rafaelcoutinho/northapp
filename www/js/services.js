var isTooOld = function (cacheInfo) {
    return cacheInfo.updated < (new Date().getTime() - (1000 * 60 * 60 * 24 * 7));
}
angular.module('north.services', ['ionic', 'ngCordova', 'ngStorage', 'ngResource', 'rcCachedResource'])

    .factory('WeatherService', function ($http, $sessionStorage, $resource, appConfigs, $q, $log) {
        return {
            getPerCoords: function (lat, lng, date) {

                var now = new Date();
                var diff = date - now.getTime();
                var deferred = $q.defer();
                diff = Math.ceil(diff / (24 * 60 * 60 * 1000));
                if ($sessionStorage.weather && $sessionStorage.weather[date]) {
                    deferred.resolve($sessionStorage.weather[date]);
                } else {

                    if (diff < -2 || diff > 16) {//até 2 dias depois
                        deferred.reject("Etapa muito antiga OU mais de 16 dias de hoje. Dif " + diff);
                    } else {
                        var url = 'http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + lat + '&lon=' + lng + '&cnt=' + diff + '&mode=json&appid=a6914b6f4ef75969ead626f11b294bf5&lang=pt';
                        $http({
                            method: 'GET',
                            url: url
                        }).then(function successCallback(response) {
                            if (response.data.cod == "404") {
                                $log.error("Falhou ao carregar clima ", url, response)
                                deferred.reject(response);
                            } else {
                                if (diff < 1) {
                                    diff = 1;
                                }
                                var weather = response.data.list[diff - 1].weather[0];
                                weather.wicon = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
                                if(!$sessionStorage.weather){
                                    $sessionStorage.weather = {};
                                }
                                $sessionStorage.weather[date] = weather;
                                deferred.resolve(weather);
                            }
                        }, function errorCallback(response) {
                            deferred.reject(response);
                        });
                    };
                }

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

    .factory('EtapasService', function ($localStorage, $resource, appConfigs, $q, $cachedResource) {
        var cacheForeverAfterComplete = function (cacheEntry) {
            var etapa = cacheEntry.data;
            if (cacheEntry.date > (new Date().getTime() - (1 * 60 * 60 * 1000))) {
                
                return true;//avoid keeping requesting..
            }
            return etapa.data < cacheEntry.date;//TODO uns 5 dias;
        }
        return $cachedResource(appConfigs.enhancedRestBackend + "/Etapa/:id", {}, {
            query: {
                isArray: true,
                cache: true,
                cr: {
                    timeout: 7 * 60 * 60 * 1000,
                    cacheHalfLife: function (cacheEntry) {
                        if (cacheEntry.date < (new Date().getTime() - (this.timeout / 1.5))) {
                            return true;
                        }
                        return false;
                    }
                }

            },
            get: {
                cache: true,
                cr: {
                    cacheName: function (params) {
                        return params.id + "_get"
                    },
                    isCacheValid: cacheForeverAfterComplete
                }
            },
            getGrid: {
                isArray: false,
                methdo: "GET",
                cr: {
                    cacheName: function (params) {
                        return params.id + "_grid"
                    },
                    isCacheValid: function (cacheEntry) {
                        if (cacheEntry.data.etapa.data < cacheEntry.date) {
                            return true;
                        } else {
                            if (cacheEntry.date < (new Date().getTime() - (24 * 60 * 60 * 1000))) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                },
                url: appConfigs.enhancedRestBackend + "/Etapa/:id/GridInfo"

            },
            getResultados: {
                isArray: true,
                url: appConfigs.enhancedRestBackend + '/Etapa/:id/Resultado',
                cr: {
                    cacheName: function (params) {
                        return params.id + "_resultados"
                    },
                    isCacheValid: function (cacheEntry) {

                        if (cacheEntry.date > (new Date().getTime() - (1 * 60 * 60 * 1000))) {
                            
                            return true;//avoid keeping requesting..
                        }
                        return cacheEntry.data.length > 0;
                    }
                }
                // url: "http://localhost/northServer/app.php/Etapa/:id/Resultado"
            }
        }, { cacheTimeout: 10, name: "Etapa" });
    })
    .factory('EtapasService2', function ($localStorage, $resource, appConfigs, $q) {

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

            },
            getResultados: {
                isArray: true,
                url: appConfigs.enhancedRestBackend + '/Etapa/:id/Resultado'
                // url: "http://localhost/northServer/app.php/Etapa/:id/Resultado"
            }
        });



        return {
            clear: function () {
                delete $localStorage.northApp_etapas;
                delete $localStorage.northApp_etapas_details;
            },
            getResultados: function (etapa) {

                var deferred = $q.defer();
                if (!$localStorage.northApp_etapas_resultados) {
                    $localStorage.northApp_etapas_resultados = {};
                }

                if ($localStorage.northApp_etapas_resultados && $localStorage.northApp_etapas_resultados[etapa.id] && $localStorage.northApp_etapas_resultados[etapa.id].updated > etapa.data) {
                    deferred.resolve($localStorage.northApp_etapas_resultados[etapa.id].data);
                } else {
                    
                    etapaResource.getResultados({ id: etapa.id }, function (response) {
                        $localStorage.northApp_etapas_resultados[etapa.id] = {
                            data: response,
                            updated: new Date().getTime()
                        }
                        deferred.resolve($localStorage.northApp_etapas_resultados[etapa.id].data);
                    }, function (error) {
                        deferred.reject(error);
                    })
                }
                return deferred.promise;
            },
            getGrid: function (etapa) {

                var deferred = $q.defer();
                if (!$localStorage.northApp_etapas_grids) {
                    $localStorage.northApp_etapas_grids = {};
                }

                if ($localStorage.northApp_etapas_grids && $localStorage.northApp_etapas_grids[etapa.id] && $localStorage.northApp_etapas_grids[etapa.id].updated > etapa.data) {
                    deferred.resolve($localStorage.northApp_etapas_grids[etapa.id].data);
                } else {
                    
                    etapaResource.getGrid({ id: etapa.id }, function (response) {
                        $localStorage.northApp_etapas_grids[etapa.id] = {
                            data: response,
                            updated: new Date().getTime()
                        }
                        deferred.resolve($localStorage.northApp_etapas_grids[etapa.id].data);
                    }, function (error) {
                        deferred.reject(error);
                    })
                }
                return deferred.promise;
            },
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
    .service('EquipesService', ['$http', '$q', '$resource', 'appConfigs','$cachedResource', function ($http, $q, $resource, appConfigs,$cachedResource) {
        return $cachedResource(appConfigs.openRestBackend + '/Equipe/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            },
            getMyEquipe: {
                isArray: false,
                url: appConfigs.enhancedRestBackend + '/Competidor/:id/Equipe',
                cr: {
                    cacheName: function (params) {
                        return params.id + "_getEquipe"
                    }
                }
            },
            
            getMembers:{
                 isArray: true,
                 url: appConfigs.openRestBackend + '/Competidor/:id',
                  cr: {
                   cacheName: function (params) {
                        return params.id + "_getMembers"
                    },
                    timeout: 7*24 * 60 * 60 * 1000
                },
                transformResponse: jsonTransformQuery
            }, 
            getResultados:{
                 isArray: true,
                 url: appConfigs.openRestBackend + '/Resultado?filter0=id_Equipe,eq,:id',
                  transformResponse: jsonTransformQuery,
                  cr: {
                   cacheName: function (params) {
                        return params.id + "_getResultados"
                    },
                    timeout: 7*24 * 60 * 60 * 1000
                }
            }
        }, {name:"EquipesService"});
       

    }])
    .service('LocationService', ['$http', '$q', '$resource', 'appConfigs','$cachedResource', function ($http, $q, $resource, appConfigs,$cachedResource) {
        return $cachedResource(appConfigs.openRestBackend + '/Local/:id', {},
        {
             get: {
                cache: true,
                cr: {
                    cacheName: function (params) {
                        return params.id + "_get"
                    },
                    timeout: 24 * 60 * 60 * 1000
                }
            },
            query: {
                isArray: true,
                cache: true,
                transformResponse: jsonTransformQuery,
                cr: {
                    timeout: 300 * 60 * 60 * 1000
                }
            }
        },
        {name:"LocSvc"});
        // return $resource(appConfigs.openRestBackend + '/Local/:id', {}, {
        //     query: {
        //         isArray: true,
        //         transformResponse: jsonTransformQuery
        //     }
        // });

    }])
    .service('RankingService', ['$http', '$q', '$resource', 'appConfigs','$cachedResource', function ($http, $q, $resource, appConfigs,$cachedResource) {
        return $cachedResource(appConfigs.enhancedRestBackend + '/Ranking', {},
        {
            query: {
                isArray: true,
                cache: true,                
                cr: {
                    timeout: 24 * 60 * 60 * 1000
                }
            }
        },
        {name:"Ranking"});
       

    }])
    .service('HighlightService', ['$http', '$q', '$resource', 'appConfigs', '$cachedResource', function ($http, $q, $resource, appConfigs, $cachedResource) {
        return $cachedResource(appConfigs.openRestBackend + '/Destaque/:id', {}, {
            query: {
                isArray: true,
                cache: true,
                transformResponse: jsonTransformQuery,
                cr: {
                    timeout: 7 * 60 * 60 * 1000,
                    cacheHalfLife: function (cacheEntry) {
                        if (cacheEntry.date < (new Date().getTime() - (this.timeout / 1.5))) {
                            return true;
                        }
                        return false;
                    }
                }

            },
            get: {
                cache: true,
                cr: {
                    cacheName: function (params) {
                        return params.id + "_get"
                    },
                    timeout: 7 * 60 * 60 * 1000
                }
            }},{name:"HL"});
    }])
    .service('HighlightService2', ['$http', '$q', '$resource', 'appConfigs', '$localStorage', function ($http, $q, $resource, appConfigs, $localStorage) {
        var resourceVar = $resource(appConfigs.openRestBackend + '/Destaque/:id', {}, {
            query: {
                isArray: true,
                cache: true,
                transformResponse: jsonTransformQuery
            }
        });
        return {
            clear: function () {
                delete $localStorage.northApp_highlights;
            },
            query: resourceVar.query,
            queryCached: function () {
                var deferred = $q.defer();

                if ($localStorage.northApp_highlights && !isTooOld($localStorage.northApp_highlights)) {

                    deferred.resolve($localStorage.northApp_highlights.data);

                } else {
                    resourceVar.query({}, function (response) {
                        $localStorage.northApp_highlights = {
                            data: response,
                            updated: new Date().getTime()
                        }
                        deferred.resolve($localStorage.northApp_highlights.data);
                    }, function (error) {
                        deferred.reject(error);
                    })
                }
                return deferred.promise;
            }
        }


    }])

    .service('UserService', function ($http, $localStorage, appConfigs, $resource, $q) {
        return $resource(appConfigs.secureEndpointBackend + '/User', {},
            {

                validate: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + '/Register'

                },
                rememberPwd: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + "/senha/LembrarSenha"
                }
            }
            );
    })
    .service('UtilsService', function ($http, $q, $resource) {
        var categorias = [
            { nome: "Pró", id: 4 },
            { nome: "Graduados", id: 3 },
            { nome: "Trekkers", id: 2 },
            { nome: "Turismo", id: 1 }
        ];
        return {
            getCategorias:function(){
                return categorias;
            },
            getLabelCategoria: function (item) {
                for (var index = 0; index < categorias.length; index++) {
                    var element = categorias[index];
                    if (item == element.id) {
                        return element.nome;
                    }
                }
                return "-";

            }

        }
    })
    .service('PushNotService', function ($http, $localStorage, $resource, $q, $log,appConfigs) {
        var pushResource = $resource(appConfigs.enhancedRestBackend + "/Msg/:id");
        return {
            gcmInited: false,
            push: null,
            initGCM: function (user) {
                try {
                    
                    var userId = null;
                    if (user) {
                        userId = user.id;
                    }
                    console.log($localStorage.associateRegId+" u="+userId+" ass="+($localStorage.associateRegId == userId)+" gcm="+this.gcmInited);
                    if (this.gcmInited == true && $localStorage.associateRegId == userId) {

                        return;
                    }

                    this.gcmInited = true;
                    this.push = PushNotification.init({
                        android: {
                            senderID: "680357415246",                            
                            iconColor: "#ff95a874",
                            vibrate: true
                        },
                        ios: {
                            alert: "true",
                            badge: "true",
                            sound: "true"
                        },
                        windows: {}
                    });

                    this.push.on('registration', function (data) {
                        // data.registrationId
                        
                        console.log("Registrou " + JSON.stringify(data));
                        console.log($localStorage.registrationId + "==" + data.registrationId+ " "+userId);
                        if ($localStorage.registrationId != data.registrationId || $localStorage.associateRegId != userId) {
                            var platform = "ios";
                            if (ionic.Platform.isAndroid()) {
                                platform = "android";
                            }


                            console.log("Needs to save registration id " + JSON.stringify({ d: data.registrationId, uId: userId }));
                            var params = { d: data.registrationId, p: platform, action: "registergcm" };
                            pushResource.save({ id: userId }, params, function (data2) {
                                console.log("Registration saved on the server");
                                $localStorage.registrationId = data.registrationId;
                                $localStorage.associateRegId = userId;
                            }, function (data) {
                                console.log("falhou " + JSON.stringify(data));
                            });
                        } else {
                            console.log("resgistration id repetida");
                        }
                    });
                    var me = this;
                    this.push.on('notification', function (data) {
                        console.log("notification " + JSON.stringify(data));
                        me.push.finish(function () {
                            console.log("processing of push data is finished");
                        });
                        // data.message,
                        // data.title,
                        // data.count,
                        // data.sound,
                        // data.image,
                        // data.additionalData
                    });

                    this.push.on('error', function (e) {
                        // e.message
                        this.gcmInited = false;
                        console.log("Erro push notification " + e.message)
                    });
                } catch (e) {
                    this.gcmInited = false;
                    console.log("Erro init gcm " + e)
                }
            }
        }
        
    })
    .service('loginService', function ($http, $localStorage, appConfigs, $resource, $q, UserService, $log,PushNotService) {

        return {
            startPwdRecovery: function (email) {
                UserService.rememberPwd({}, { email: email });
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
                PushNotService.initGCM($localStorage.northApp_user);
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
            getUser: function () {
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
    // Customized for Android and desktop
  .service('$cordovaLaunchNavigator', ['$q','$cordovaInAppBrowser', function ($q,$cordovaInAppBrowser) {
    "use strict";

    var $cordovaLaunchNavigator = {};
    $cordovaLaunchNavigator.navigate = function (destination, options) {
        if (!options) {
            options = {};
        }
        var q = $q.defer();
        
        try {
            // if(isRealDevice){
            //      if (destination instanceof Array) {
            //         $cordovaInAppBrowser.open("https://www.google.com.br/maps/search/"+encodeURI(destination[0]) + "," + encodeURI(destination[1])+"", "_system");
            //      }else{
            //          $cordovaInAppBrowser.open("https://www.google.com.br/maps/search/"+encodeURI(destination), "_system");
            //      }
            //     q.resolve();
            // }else 
            if (ionic.Platform.isAndroid()) {
                console.log("Plataforma android");
                var ref = null;
                if (destination instanceof Array) {
                    console.log("Latitude");
                    ref = $cordovaInAppBrowser.open('geo:' + encodeURI(destination[0]) + "," + encodeURI(destination[1]), "_system");
                    q.resolve();
                } else {
                    console.log("Endereço");
                    ref = $cordovaInAppBrowser.open('geo:?&q=' + destination, "_system");

                }
                if (ref) {
                    ref.addEventListener('loadstart', function (event) { q.resolve(); });
                    ref.addEventListener('loaderror', function (event) { q.reject(event); });
                } else {
                    q.reject("Fail to open");
                }

            } else {

                var
                    successFn = options.successCallBack || function () {
                    },
                    errorFn = options.errorCallback || function () {
                    },
                    _successFn = function () {
                        successFn();
                        q.resolve();
                    },
                    _errorFn = function (err) {
                        errorFn(err);
                        q.reject(err);
                    };

                options.successCallBack = _successFn;
                options.errorCallback = _errorFn;
                                       options.avoidReverseGeocoding=true;
                launchnavigator.navigate(destination, options);


            }
        } catch (e) {
            q.reject("Exception: " + e.message);
        }
        return q.promise;
    };

    return $cordovaLaunchNavigator;
  }])