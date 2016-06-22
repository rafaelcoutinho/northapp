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
            getInscricao: {
                isArray: false,
                cache: true,
                method: "GET",
                url: appConfigs.enhancedRestBackend + "/InscricaoCompetidor/:idEtapa/:idTrekker",
                cr: {
                    cacheName: function (params) {
                        return params.id + "_inscricao"
                    },
                    timeout: 30 * 60 * 1000,
                    cacheHalfLife: function (cacheEntry) {
                        if (cacheEntry.date < (new Date().getTime() - (this.timeout / 1.5))) {
                            return true;
                        }
                        return false;
                    }
                }
            },
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
                method: "GET",
                cr: {
                    cacheName: function (params) {
                        return params.id + "_grid"
                    },
                    // cacheHalfLife: function (cacheEntry) {
                    //      if (cacheEntry.data.etapa.data < cacheEntry.date) {
                    //         return true;
                    //     }
                    // },
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
                 method: "GET",
                url: appConfigs.enhancedRestBackend + '/Etapa/:id/Resultado',
                cr: {
                    cacheName: function (params) {
                        return params.id + "_resultados"
                    },
                    isCacheValid: function (cacheEntry) {
                        console.log("cache entry",cacheEntry)
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
    .service('EquipesService', ['$http', '$q', '$resource', 'appConfigs','$cachedResource', function ($http, $q, $resource, appConfigs,$cachedResource) {
        return $cachedResource(appConfigs.openRestBackend + '/Equipe/:id', {}, {
            query: {
                isArray: true,
                transformResponse: jsonTransformQuery
            },
            getMyEquipe: {
                isArray: false,
                method:"GET",
                url: appConfigs.enhancedRestBackend + '/Competidor/:id/Equipe',
                cr: {
                    cacheName: function (params) {
                        return params.id + "_getEquipe"
                    },
                    timeout: 7*24 * 60 * 60 * 1000
                }
            },
            
            getMembers:{
                 isArray: true,
                 method:"GET",
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
                 method:"GET",
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
   
    .service('UserService', function ($http, $localStorage, appConfigs, $resource, $q) {
        return $resource(appConfigs.secureEndpointBackend + '/User', {},
            {

                validate: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + '/Register'

                },
                updatePwd: {
                    method: "POST",
                    isArray: false,
                    url: appConfigs.secureEndpointBackend + "/senha/Alterar"
                    // url: "http://localhost/northServer/senha.php/Alterar"
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

            },
            getUnTieReasons:function(){
                var razoes =["conseguiu melhor colocação","conseguiu mais vezes melhor colocação","teve mais participações","empatados até nos critérios de desempate"];
                return razoes;
            },
            getUnTieReasonsMsg:function(equipe){
                var msg="";
                if(!equipe.tieInfo){
                    return msg;
                }
                for(var i =0;i<equipe.tieInfo.length;i++){
                    var info = equipe.tieInfo[i];
                    
                    if(info.inverse==true){
                        msg+= info.contra.nome+" "+this.getUnTieReasons()[info.razao]+"\n";    
                    }else{
                        msg+= equipe.nome+" "+this.getUnTieReasons()[info.razao]+" que "+info.contra.nome+"\n";
                    }
                }
                return msg;
                
            },
            sortRanking:function(ranking){
                function getContraInfo(e){
                    return {nome:e.nome,id_Equipe:e.id_Equipe};
                }
                
                function compare(a, b) {
                    if (a.id_Categoria < b.id_Categoria) {
                        return -1;
                    }
                    else if (a.id_Categoria > b.id_Categoria) {
                        return 1;
                    }
                    else {
                        if (a.pontos > b.pontos)
                            return -1;
                        else if (a.pontos < b.pontos)
                            return 1;
                        else {
                            if (!a.tieInfo) {
                                a.tieInfo = [];
                            }
                            if (!b.tieInfo) {
                                b.tieInfo = [];
                            }
                            if (a.col && b.col) {
                                var ja = 0;
                                var jb = 0;
                                while (ja < a.col.length && jb < b.col.length) {
                                    if (a.col[ja].colocacao < b.col[jb].colocacao) {
                                        console.debug(a.nome + " ficou melhor colocado " + b.nome, a.col[ja], b.col[jb]);

                                        a.tieInfo.push({
                                            contra: getContraInfo(b),
                                            razao: 0,
                                            inverse: false
                                        });
                                        b.tieInfo.push({
                                            contra: getContraInfo(a),
                                            razao: 0,
                                            inverse: true
                                        });

                                        return -1;
                                    } else if (a.col[ja].colocacao > b.col[jb].colocacao) {
                                        console.debug(a.nome + " ficou pior colocado " + b.nome, a.col[ja], b.col[jb]);
                                        a.tieInfo.push({
                                            contra: getContraInfo(b),
                                            razao: 0,
                                            inverse: true
                                        });
                                        b.tieInfo.push({
                                            contra: getContraInfo(a),
                                            razao: 0,
                                            inverse: false
                                        });
                                        return 1;
                                    } else {
                                        if (a.col[ja].vezes > b.col[jb].vezes) {
                                            console.debug(a.nome + " ficou mais vezes que " + b.nome, a.col[ja], b.col[jb]);
                                            a.tieInfo.push({
                                                contra: getContraInfo(b),
                                                razao: 1,
                                                inverse: false
                                            });
                                            b.tieInfo.push({
                                                contra: getContraInfo(a),
                                                razao: 1,
                                                inverse: true
                                            });

                                            return -1;
                                        } else if (a.col[ja].vezes < b.col[jb].vezes) {
                                            console.ldebugog(a.nome + " ficou menos vezes que " + b.nome, a.col[ja], b.col[jb]);
                                            a.tieInfo.push({
                                                contra: getContraInfo(b),
                                                razao: 1,
                                                inverse: true
                                            });
                                            b.tieInfo.push({
                                                contra: getContraInfo(a),
                                                razao: 1,
                                                inverse: false
                                            });
                                            return 1;//b foi mais vezes, fica mais para cima no ranking
                                        } else {
                                            ja++;
                                            jb++;
                                        }
                                    }

                                }
                                if (a.col.length > b.col.length) {
                                    console.debug(a.nome + " participou mais que  " + b.nome + " em ", a.col.length, b.col.length);
                                    a.tieInfo.push({
                                        contra: getContraInfo(b),
                                        razao: 2,
                                        inverse: false
                                    });
                                    b.tieInfo.push({
                                        contra: getContraInfo(a),
                                        razao: 2,
                                        inverse: true
                                    });
                                    return -1;//a teve mais participacoes
                                } else if (a.col.length < b.col.length) {
                                    console.debug(b.nome + " participou mais que  " + a.nome + " em ", a.col.length, b.col.length);
                                    a.tieInfo.push({
                                        contra: getContraInfo(b),
                                        razao: 2,
                                        inverse: true
                                    });
                                    b.tieInfo.push({
                                        contra: getContraInfo(a),
                                        razao: 2,
                                        inverse: false
                                    });
                                    return 1;//b teve mais participacoes
                                } else {
                                    a.tieInfo.push({
                                        contra: getContraInfo(b),
                                        razao: 3,
                                        inverse: false
                                    });
                                    b.tieInfo.push({
                                        contra: getContraInfo(a),
                                        razao: 3,
                                        inverse: false
                                    });

                                    console.warn("Realmente empatados " + a.nome + " e " + b.nome, a.col, b.col);
                                    return 0;
                                }

                            } else {
                                console.log("Erro! nao carregou colocacoes de dois empatados" + a.nome + " e " + b.nome);
                            }
                            return 0;
                        }
                    }
                }
                    
                    return ranking.sort(compare);
            }

        }
    })
    .service('PushNotService', function ($http, $localStorage, $resource, $q, $log,appConfigs, $state,EtapasService) {
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
                            icon:'noti',
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
                        console.log("recebeu notificacao " + JSON.stringify(data));
                        if (data.additionalData && data.additionalData.action) {
                            console.log(data.additionalData.action + "=" + data.additionalData);
                            switch (data.additionalData.action) {
                                case "etapa":
                                    if (data.additionalData.idEtapa) {
                                        $state.go("app.etapa", { id: data.additionalData.idEtapa, t: "details" });
                                    }

                                    break;
                                case "results":
                                    $state.go("app.etapa", { id: data.additionalData.idEtapa, t: "results" });
                                    break;
                                case "grid":
                                    $state.go("app.etapa", { id: data.additionalData.idEtapa, t: "grid" });
                                    break;
                                default:
                                    console.log("acao desconhecida " + data.additionalData.action);
                                    break;
                            }
                            

                        }
                        me.push.finish(function () {
                            console.log("processing of push data is finished");
                        });
                        
                        
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
    .service('loginService', function ($http, $localStorage, appConfigs, $resource, $q, UserService, $log,PushNotService,$rootScope) {

        return {
            startPwdRecovery: function (email) {
                var deferred = $q.defer();
                UserService.rememberPwd({}, { email: email },function(response){
                     deferred.resolve(response.data);
                },
                function(error){
                     deferred.reject(error);
                });
                return deferred.promise;
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
                $rootScope.$emit("userLogged", aUser);
                
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