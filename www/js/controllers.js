angular.module('north.controllers', ['ionic', 'ngCordova', 'ngStorage', 'north.services'])

    .controller('AppCtrl', function ($scope, $ionicModal, $ionicPlatform, $timeout, $ionicPush, $cordovaLocalNotification) {

        if ($scope.shide != true) {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
                $scope.shide = true;
            } else {
                console.log("Nao achou splashscreen, vai faze-lo novamente mais tarde..")
                window.setTimeout(function () {
                    if (navigator && navigator.splashscreen) {
                        navigator.splashscreen.hide();
                        $scope.shide = true;
                    } else {
                        console.log("Nao achou novamente splashscreen, timeout padrao sendo utilizado..")
                    }
                }, 3000);
            }
        }



    })
    .controller('TeamCtrl', function ($scope) {
        $scope.pics = ['http://www.northbrasil.com.br/northbrasil/Ftp/ENDURO_08CAMPINAS2015/THUMB_ENDURO_PQECOLOGICO_CAMPINAS_2015_678.JPG', 'http://www.northbrasil.com.br/northbrasil/Ftp/ENDURO_08CAMPINAS2015/THUMB_ENDURO_PQECOLOGICO_CAMPINAS_2015_665.JPG'];
    })
    .controller('HighlightCtrl', function ($scope, HighlightService) {
        $scope.highlights = HighlightService.query(function (data) { console.log("Carregou " + data) }, function (data) { console.log("Falhou " + JSON.stringify(data)) });

    }).controller('ProfileCtrl', function ($scope, $cordovaFacebook, loginService) {
        $scope.user = loginService.getUser();

        $scope.getfbinfo = function () {
            $cordovaFacebook.api("me", ["public_profile", "email", "user_friends"
            ]).then(function (success) {
                console.log("public " + JSON.stringify(success));
                $scope.logUserIn(success);
            }, function (error) {
                $scope.login_error = 'Erro carregando informações do Facebook';
            });
        };
        if ($scope.user != null) {
            $scope.getfbinfo();
        }
        $scope.doLoginFB = function () {
            $cordovaFacebook.login(["public_profile", "email"
            ]).then(function (user) {
                console.log("sucesso " + JSON.stringify(user));
                if (user.email) {
                    $scope.logUserIn(user);
                } else {
                    $scope.getfbinfo();
                }

            }, function (error) {
                console.log("error " + JSON.stringify(error));
                $scope.login_error = 'Erro logando com Facebook';
            });

        }
        $scope.logUserIn = function (user) {
            console.log("pegou usuario user " + JSON.stringify(user))
            var localUser = {
                email: user.email,
                "name": user.name,
                fbId: user.id,
                image: "http://graph.facebook.com/" + user.id + "/picture?width=128&height=128",
                "id": user.id
            }
            loginService.setUser(localUser);
            $scope.user = loginService.getUser();
        };

    })


    .controller('EtapasCtrl', function (
        $scope, $stateParams, WeatherService, EtapasService, LocationService, $location, $ionicBackdrop, $timeout, $rootScope, $ionicHistory, $cordovaInAppBrowser, GridService) {
        $scope.currTab = "details";
        $scope.tabstemplate = "templates/etapa.tabs.html";
        $scope.setTab = function (tabName) {
            $scope.currTab = tabName;
        }
        $scope.isTab = function (val) {

            if ($scope.currTab == val) {
                return " active";
            }
            return "";
        }

        $scope.etapas = EtapasService.query(function () {
            for (var index = 0; index < $scope.etapas.length; index++) {
                var element = $scope.etapas[index];
                if (element.id == $stateParams.id) {
                    $scope.etapa = element;
                    break;
                }

            }
        });
        if ($stateParams.id) {
            console.log("Etapa is here", $scope.etapas.length)
            $scope.etapa = EtapasService.get({ id: $stateParams.id }, function (data) {
                if (data.id_Local) {
                    $scope.etapa.location = LocationService.get({ id: $scope.etapa.id_Local }, function (location) {
                        if (location.latitude != null) {
                            var lat = parseFloat(location.latitude) / 1000000;
                            var lng = parseFloat(location.latitude) / 1000000;

                            WeatherService.getPerCoords(lat, lng, data.data).then(function (weather) {
                                $scope.weather = weather;

                            },
                                function (err) {
                                    console.log("erro carregando clima", err);
                                });
                        }
                    })
                }
            });


            $scope.gridInfo = GridService.query();

        }
        $scope.tel = function (phone) {
            window.open('tel:' + phone);
        }
        $scope.web = function (website) {

            $cordovaInAppBrowser.open('http://' + website, '_blank')
                .then(function (event) {
                    // success
                })
                .catch(function (event) {
                    // error
                });

        }
        $scope.maps = function (etapa) {

            if (ionic.Platform.isIOS()) {
                console.log("ios");
                window.open('waze://?ll=' + encodeURI(etapa.location.endereco) + '&navigate=yes');
            } else if (ionic.Platform.isAndroid()) {
                console.log("android");
                if (etapa.location.coords != null) {
                    $cordovaInAppBrowser.open('geo:' + encodeURI(etapa.location.coords), "_system");
                } else {
                    $cordovaInAppBrowser.open('geo:?&q=' + etapa.location.endereco, "_system");
                }
            } else {
                window.open('geo:' + encodeURI(etapa.location.coords) + '?&q=' + encodeURI(etapa.location.address));
            }
        }
    })

    .controller('RankingCtrl', function ($scope, $stateParams, EtapasService) {
        $scope.etapas = EtapasService.query();
        $scope.currEtapaIndex = 0;
        $scope.expandedEquipe = -1;
        $scope.showEquipeDetails = function (equipe) {
            return $scope.expandedEquipe == equipe.name;
        }
        $scope.expandDetails = function (equipe) {
            $scope.expandedEquipe = equipe.name;
        }

        $scope.nextEtapa = function () {
            $scope.currEtapaIndex++;
        }
        $scope.previousEtapa = function () {
            if ($scope.currEtapaIndex > 0) {
                $scope.currEtapaIndex--;
            }
        }
        $scope.getCurrentEtapa = function (equipe) {
            return equipe.points[$scope.currEtapaIndex];
        }
        $scope.getCurrentEtapaName = function () {
            return $scope.etapas[$scope.currEtapaIndex].title;
        };
        $scope.results = [{
            "name": "Anta",
            pics: ['spengler.jpg', 'venkman.jpg'],
            points: [{
                position: 20,
                etapaId: 1,
                points: 1.96
            }, {
                    position: 2,
                    etapaId: 2,
                    points: 17
                }
            ],
            total: {
                position: 1,
                points: 102
            }
        }, {
                "name": "TTT",
                pics: ['stantz.jpg', 'winston.jpg', 'tully.jpg'],
                points: [{
                    position: 19,
                    etapaId: 1,
                    points: 2.0
                }, {
                        position: 3,
                        etapaId: 2,
                        points: 15
                    }
                ],
                total: {
                    position: 2,
                    points: 100
                }
            }, {
                "name": "CuméQé",
                pics: ['slimer.jpg'],
                points: [{
                    position: 99,
                    etapaId: 1,
                    points: 0.0
                }, {
                        position: 98,
                        etapaId: 2,
                        points: 1.0
                    }
                ],
                total: {
                    position: 99,
                    points: -1
                }
            }
        ];

    });
