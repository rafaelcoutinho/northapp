angular.module('north.controllers', ['ionic', 'ngCordova', 'ngStorage', 'north.services', 'rcCachedResource'])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaInAppBrowser) {

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
    .controller('BreveCtrl', function ($scope, $cordovaInAppBrowser, $resource, appConfigs) {

        $scope.openGitHub = function () {
            $cordovaInAppBrowser.open('https://github.com/rafaelcoutinho/northapp', '_blank')
        }
    })
    .filter('leadingZero', function ($filter) {
        return function (input) {
            if (isNaN(input)) {
                return "-";
            } else {
                if (input < 10) {
                    return '0' + input;
                } else {
                    return input;
                }

            };
        };
    })
    .controller('TeamCtrl', function ($scope, EquipesService, loginService) {
        $scope.user = loginService.getUser();
        if ($scope.user != null) {
            $scope.info = EquipesService.getMyEquipe({ id: $scope.user.id });
        }


    })
    .controller('HighlightCtrl', function ($scope, HighlightService) {
        $scope.doRefresh = function (avoidClear) {
            if (!avoidClear || avoidClear == false) {

                HighlightService.clear();
            }
            HighlightService.query().then(
                function (data) { console.log("Carregou " + data); $scope.highlights = data; $scope.$broadcast('scroll.refreshComplete'); },
                function (data) { console.log("Falhou " + JSON.stringify(data)); $scope.$broadcast('scroll.refreshComplete'); });
        }
        $scope.doRefresh(true);
    })
    .controller('MenuCtrl', function ($scope, $stateParams, EtapasService) {
        $scope.menuBtns = [];
        $scope.$on('$routeChangeStart', function (next, current) {
            console.log("changed")
            //$scope.menuBtns = [];
        });
        $scope.$on('showRight', function (event, mass) {
            console.log("showRight")
            $scope.menuBtns.push({ label: "Salvar" });
            console.log("showRight ", $scope.menuBtns)
        });
    })
    .controller('ProfileCtrl', function ($scope, $cordovaFacebook, loginService, $ionicModal, UserService, $log, $rootScope, $ionicPopup) {
        $rootScope.$broadcast('showRight', [1, 2, 3]);
        $scope.user = loginService.getUser();
        if ($scope.user == null) {
            $scope.user = {};
        }

        $scope.haschange = false;
        $scope.showpassword = false;
        $scope.togglePwd = function () {
            $scope.showpassword = true;
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        $scope.saveData = function () {
            $scope.errorMsg = null;
            if ($scope.user.id == null) {

                if ($scope.user.password == null || $scope.user.password.length < 3) {
                    $scope.errorMsg = "Senha é um campo obrigatório e com pelo menos 3 caracteres.";
                    return;
                } else if (!$scope.user.email || $scope.user.email.length == 0 || !re.test($scope.user.email)) {
                    $scope.errorMsg = "Por favor insira um e-mail válido.";
                    return;
                }
                loginService.validateNewUser($scope.user).then(function (user) {
                    $scope.user = user;
                    $scope.haschange = false;
                    $scope.showForm = false;
                }, function (fail) {
                    switch (fail.errorCode) {
                        case 800:
                            $scope.errorMsg = "Você já está cadastrado no aplicativo, utilize o Login ou Facebook para entrar.";
                            break;
                        case 803:
                            $scope.errorMsg = "Senha é um campo obrigatório.";
                            break;
                        default:
                            $scope.errorMsg = "Erro ao cadastrar, verifique seus dados.";
                    }

                });
            } else {
                loginService.saveUser($scope.user).then(
                    function () {
                        console.log("salvou")
                        $scope.haschange = false;
                    })

            }
        };
        $scope.doShowForm = function () {
            $rootScope.$broadcast('showRight', [1, 2, 3]);
            $scope.showForm = true;
        }

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
        $scope.showConfirm = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Lembrar senha',
                template: 'Um e-mail será enviado para executar o reset de sua senha. Desenha continuar?'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    loginService.startPwdRecovery($scope.loginData.username);
                    $scope.closeLogin();
                } else {

                }
            });
        };
        $scope.rememberPwd = function () {
            if ($scope.loginData.username == null) {
                $scope.loginData.errorMsg = "Por favor preencha seu endereço de e-mail."
            } else {
                // A confirm dialog
                $scope.showConfirm();
            }
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
        $scope.logoff = function () {
            $scope.user = {};
            loginService.setUserLocally(null);
            try {
                $cordovaFacebook.logout();
            } catch (e) {

            }
        };

        $scope.getfbinfo = function () {
            try {
                console.log("Api facebook")
                $cordovaFacebook.api("me/?fields=id,name,email", FBPerms).then($scope.logUserInWithFB, function (error) {
                    $scope.errorMsg = 'Erro carregando informações do Facebook';
                });
            } catch (e) {
                console.log("Facebook not available")
            }
        };
        var FBPerms = ["email", "public_profile", "user_friends"]
        $scope.doLoginFB = function () {
            try {
                $cordovaFacebook.login(FBPerms).then(function (user) {
                    console.log("sucesso " + JSON.stringify(user));
                    console.log("sucesso ", user);
                    if (user.email) {
                        $scope.logUserInWithFB(user);
                    } else {
                        $scope.getfbinfo();
                    }

                }, function (error) {
                    console.log("error " + JSON.stringify(error));
                    $scope.errorMsg = 'Erro conectando com Facebook';
                });

            } catch (e) {
                console.log("Facebook not available")
            }

        };

        $scope.logUserInWithFB = function (user) {
            if (user.email == null || user.email == "") {
                $scope.errorMsg = 'Erro: Não foi possível obter de e-mail do Facebook';
                $cordovaFacebook.logout()
                    .then(function (success) {
                        console.log("Deslogou")
                    }, function (error) {
                        console.log("falhou ao deslogar" + error)
                    });
                $scope.user.nome = user.name;
                $scope.user.fbId = user.id;
                $scope.showForm = true;
                return;
            }
            var dbUser = {
                nome: user.name,
                email: user.email,
                fbId: user.id
            }
            loginService.validateNewUser(dbUser, { fromFB: true }).then(function (userServer) {
                $scope.user = loginService.getUser();
            }, function (fail) {
                $log.log(fail)
                $scope.errorMsg = "Erro ao cadastrar, verifique seus dados.";

            });

        };


    })

    .controller('EtapaCtrl', function (
        $scope, $stateParams, WeatherService, EtapasService, LocationService, $location, $ionicBackdrop, $timeout, $rootScope, $ionicHistory, $cordovaInAppBrowser, $localStorage, $log) {
        $scope.currTab = "details";
        $scope.tabstemplate = "templates/etapa.tabs.html";
        $scope.etapaNotComplete = true;
        $scope.categorias = [
            { nome: "Pró", id: 4 },
            { nome: "Graduados", id: 3 },
            { nome: "Trekkers", id: 2 },
            { nome: "Turismo", id: 1 }
        ];

        $scope.getLastSelectedCat = function () {
            var selectedCat = $scope.categorias[0].id;
            if ($localStorage.lastSelectedCat) {
                selectedCat = $localStorage.lastSelectedCat;
            }

            return { id_Categoria: selectedCat };
        }
        $scope.getLastSelectedGrid = function () {
            var grid = $scope.categoriasGrid[0].id;
            if ($localStorage.lastSelectedGrid) {
                grid = $localStorage.lastSelectedGrid;
            }

            return { id_Config: grid };
        }
        $scope.updatePrefCategoria = function (idCat, idGrid) {
            if (idCat != null) {
                $localStorage.lastSelectedCat = idCat;
            }
            if (idGrid != null) {
                $localStorage.lastSelectedGrid = idGrid;
            }
        }

        $scope.categoriasGrid = [
            { nome: "Pró", id_Config: 4 },
            { nome: "Graduados", id_Config: 3 },
            { nome: "Trekkers / Turismo", id_Config: 1 }
        ];
        $scope.getLabelCategoria = function (item) {
            for (var index = 0; index < $scope.categorias.length; index++) {
                var element = $scope.categorias[index];
                if (item == element.id) {
                    return element.nome;
                }
            }
            return "-";

        }
        $scope.isInCategoria = function (categoriaGrid) {
            return function (item) {

                if ((item.id_Categoria == 1 || item.id_Categoria == 0)) {
                    return categoriaGrid.id_Config == 1;
                }
                return categoriaGrid.id_Config == item.id_Categoria;
            };
        }

        $scope.setTab = function (tabName) {
            $scope.currTab = tabName;
            if ($scope.currTab == "grid" && !$scope.inscricaoInfo) {
                EtapasService.getGrid($scope.etapa).then(function (data) {
                    $scope.inscricaoInfo = data;
                });
            } else if ($scope.currTab == "results") {
                EtapasService.getResultados($scope.etapa).then(function (data) {
                    $scope.resultados = data;
                }, function (error) {

                });
            }
        }
        $scope.isTab = function (val) {

            if ($scope.currTab == val) {
                return " active";
            }
            return "";
        }

        EtapasService.get({ id: $stateParams.id }).then(function (dadosEtapa) {

            $scope.etapa = dadosEtapa;
            $scope.aconteceuEtapa = $scope.etapa.data < new Date().getTime();
            if (dadosEtapa.id_Local) {
                LocationService.get({ id: $scope.etapa.id_Local }).then(function (location) {
                    $scope.etapa.location = location;
                    if (location.latitude != null) {
                        var lat = parseFloat(location.latitude) / 1000000;
                        var lng = parseFloat(location.latitude) / 1000000;

                        WeatherService.getPerCoords(lat, lng, dadosEtapa.data).then(function (weather) {
                            $scope.weather = weather;

                        },
                            function (err) {
                                $log.log("erro carregando clima", err);
                            });
                    }
                })
            }

        }, function (error) {
            $log.log("Não carregou etapa");
        });



        $scope.tel = function (phone) {
            window.open('tel:' + phone);
        }
        $scope.web = function (website) {
            if (!website.startsWith("http")) {
                website = "http://" + website;
            }
            $cordovaInAppBrowser.open(website, '_blank')
                .then(function (event) {
                    // success
                })
                .catch(function (event) {
                    // error
                });

        }
        $scope.maps = function (etapa) {

            if (ionic.Platform.isIOS()) {
                if (etapa.location.latitude != null) {
                    window.open('waze://?ll=' + encodeURI((etapa.location.latitude / 1000000) + "," + (etapa.location.longitude / 1000000)) + '&navigate=yes');
                } else {
                    window.open('waze://?q=' + encodeURI(etapa.location.endereco) + '&navigate=yes');
                }
            } else if (ionic.Platform.isAndroid()) {
                console.log("android");
                if (etapa.location.latitude != null) {
                    $cordovaInAppBrowser.open('geo:' + encodeURI((etapa.location.latitude / 1000000) + "," + (etapa.location.longitude / 1000000)), "_system");
                } else {
                    $cordovaInAppBrowser.open('geo:?&q=' + etapa.location.endereco, "_system");
                }
            } else {
                window.open('geo:' + encodeURI((etapa.location.latitude / 1000000) + "," + (etapa.location.longitude / 1000000)) + '?&q=' + encodeURI(etapa.location.endereco));
            }
        }
    })
    .controller('EtapasCtrl', function (
        $scope, $stateParams, WeatherService, EtapasService, LocationService, $location, $anchorScroll) {

        $scope.doRefresh = function () {
            EtapasService.clear();
            $scope.loadData();
        }
        $scope.loadData = function () {
            EtapasService.query().then(function (data) {
                $scope.etapas = data;
                $scope.$broadcast('scroll.refreshComplete');
                var twoDaysAgo = new Date().getTime() - (24 * 60 * 60 * 1000 * 2);
                for (var index = 0; index < $scope.etapas.length; index++) {
                    var element = $scope.etapas[index];
                    //até 2 dias seguintes a etapa deve-se centralizar nela
                    if (!$scope.etapa && element.data > twoDaysAgo) {
                        $scope.etapa = element;
                    }
                    if (element.id_Local) {
                        LocationService.get({ id: element.id_Local }).then(function (data) {
                            for (var index = 0; index < $scope.etapas.length; index++) {
                                var element = $scope.etapas[index];
                                if(element.id_Local==data.id){
                                    $scope.etapas[index].location = data;
                                    return;        
                                }
                                
                            }
                            
                        });
                    }
                }
                $location.hash($scope.etapa.id);
                $anchorScroll();

            }, function () {
                $scope.$broadcast('scroll.refreshComplete');
            });
        }

        $scope.loadData();

    })

    .controller('RankingCtrl', function ($scope, $stateParams, EtapasService) {


    });
