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

    }).controller('ProfileCtrl', function ($scope, $cordovaFacebook, loginService, $ionicModal, UserService) {
        $scope.user = loginService.getUser();
        if ($scope.user == null) {
            $scope.user = {};
        }
        $scope.saveData = function () {
            $scope.errorMsg = null;
            loginService.setUser($scope.user).then(function (user) {
                $scope.user = user;
            }, function (fail) {
                if (fail == "dupe") {
                    $scope.errorMsg = "Usuário já existente. Utilize a função de login.";
                } else {
                    $scope.errorMsg = "Erro ao cadastrar, verifique seus dados.";
                }
            });
        };
        $scope.doShowForm = function () {
            $scope.showForm = true;
        }
        $scope.getfbinfo = function () {
            try {
                $cordovaFacebook.api("me", ["public_profile", "email", "user_friends"
                ]).then(function (user) {
                    console.log("public " + JSON.stringify(user));
                    $scope.user.email = user.email;
                    $scope.user.nome = user.name;
                    $scope.user.fbId = user.id;
                    $scope.user.imagem = "http://graph.facebook.com/" + user.id + "/picture?width=128&height=128";
                    $scope.logUserIn();
                }, function (error) {
                    $scope.errorMsg = 'Erro carregando informações do Facebook';
                });
            } catch (e) {
                console.log("Facebook not available")
            }
        };
        if ($scope.user != null && $scope.user.fbId != null) {
            $scope.getfbinfo();
        }
        $scope.doLoginFB = function () {
            try {
                $cordovaFacebook.login(["public_profile", "email"
                ]).then(function (user) {
                    console.log("sucesso " + JSON.stringify(user));
                    if (user.email) {
                        $scope.user.email = user.email;
                        $scope.user.nome = user.name;
                        $scope.user.fbId = user.id;
                        $scope.user.imagem = "http://graph.facebook.com/" + user.id + "/picture?width=128&height=128";
                        $scope.logUserIn();
                    } else {
                        $scope.getfbinfo();
                    }

                }, function (error) {
                    console.log("error " + JSON.stringify(error));
                    $scope.errorMsg = 'Erro logando com Facebook';
                });

            } catch (e) {
                console.log("Facebook not available")
            }

        };
        $scope.logoff = function () {
            $scope.user = null;
            loginService.setUserLocally(null);
        }
        $scope.logUserIn = function () {
            if ($scope.user.email == null || $scope.user.email == "") {
                $scope.errorMsg = 'Erro: Não foi possível obter de e-mail do Facebook';
                $scope.showForm = true;
                return;
            }
            loginService.setUser($scope.user).then(function (user) {
                $scope.user = loginService.getUser();
            }, function (fail) {
                if (fail == "dupe") {
                    //deve ter sido por facebook
                    $scope.user = UserService.byEmail(
                        {
                            email: $scope.user.email
                        },
                        function (serverUser) {
                            $scope.user.id = serverUser[0];
                            loginService.setUser($scope.user);
                        }
                        );
                } else {
                    $scope.errorMsg = "Erro ao cadastrar, verifique seus dados.";
                }
            });

        };

        $scope.loginData = {};
        $scope.executeLogin = function () {

            $scope.loginData.errorMsg = "";
            loginService.login($scope.loginData.username, $scope.loginData.password).then(
                function (userInfo) {
                    console.log(userInfo);
                    $scope.closeLogin();
                    $scope.user = userInfo;
                    loginService.setUserLocally($scope.user);

                },
                function (error) {
                    console.log(error);
                    $scope.loginData.errorMsg = "Usuário ou senha incorretos."

                }
                );
        }
        $ionicModal.fromTemplateUrl('templates/login.html', function (modal) {
            $scope.modal = modal;
        }, {
                scope: $scope,
                animation: 'slide-in-up'
            });
        $scope.doLogin = function () {
            $scope.openModal();
        }
        $scope.openModal = function () {
            $scope.modal.show();
        };
        $scope.closeLogin = function () {
            $scope.modal.hide();
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
