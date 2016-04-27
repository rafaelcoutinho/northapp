angular.module('north.controllers', ['ionic', 'ngCordova', 'ngStorage', 'north.services', 'rcCachedResource'])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaInAppBrowser, PushNotService, loginService, $ionicPlatform) {

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
        $ionicPlatform.ready(function () {

            PushNotService.initGCM(loginService.getUser());
        });


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
    .controller('TeamCtrl', function ($scope, EquipesService, loginService, $location, EtapasService, RankingService, UtilsService, $rootScope) {
        $scope.user = loginService.getUser();
        $rootScope.$on("userLogged", function (userData) {
            $scope.user = loginService.getUser();
            $scope.doRefresh(true);
        });
        $scope.doRefresh = function (force) {
            $scope.user = loginService.getUser();
            if (loginService.getUser() != null) {
                if (force == true) {
                    EquipesService.clear();
                }

                EquipesService.getMyEquipe({ id: loginService.getUserID() }).then(function (data) {
                    $scope.info = data;
                    $scope.ranking = [];
                    if (data.equipe != null) {


                        RankingService.query().then(function (data) {
                            for (var index = 0; index < data.length; index++) {
                                var element = data[index];
                                if (element.id_Categoria == $scope.info.equipe.id_Categoria) {
                                    $scope.ranking.push(element);
                                }
                            }

                            $scope.ranking.sort(function (p1, p2) {
                                var a = p1.pontos;
                                var b = p2.pontos;
                                return a < b ? -1 : (a > b ? 1 : 0);
                            });
                            var posicao = 0;
                            for (var index = $scope.ranking.length - 1; index >= 0; index--) {
                                posicao++;
                                var eRanking = $scope.ranking[index];
                                if (eRanking.id_Equipe == $scope.info.equipe.id) {
                                    $scope.rankingAtual = eRanking;
                                    $scope.rankingAtual.colocacao = posicao;
                                    $scope.proximo = $scope.ranking[index + 1];
                                    $scope.anterior = $scope.ranking[index - 1];
                                    break;
                                }
                            }
                            $scope.$broadcast('scroll.refreshComplete');

                        }, function (error) {
                            $scope.$broadcast('scroll.refreshComplete');
                        }
                            );
                        EquipesService.getResultados({ id: data.equipe.id }).then(function (results) {
                            $scope.results = results;
                            for (var index = 0; index < results.length; index++) {
                                var element = results[index];

                                EtapasService.get({ id: element.id_Etapa }).then(function (etapa) {

                                    for (var index = 0; index < $scope.results.length; index++) {
                                        var element = $scope.results[index];


                                        if (element.id_Etapa == etapa.id) {
                                            element.etapa = etapa;
                                            break;
                                        }
                                    }
                                    $scope.$broadcast('scroll.refreshComplete');
                                }, function (erro) {
                                    console.log("Error", erro);
                                    $scope.$broadcast('scroll.refreshComplete');
                                })
                            }
                        });
                    } else {
                        $scope.$broadcast('scroll.refreshComplete');;
                    }
                });
            } else {
                $scope.$broadcast('scroll.refreshComplete');
            }
        }

        $scope.doRefresh();
        $scope.irPerfil = function () {
            $location.path("/app/profile");
        }
        $scope.getLabelCategoria = function (id) {
            return UtilsService.getLabelCategoria(id);
        }


    })
    .controller('HighlightCtrl', function ($scope, HighlightService, $state) {
        $scope.doRefresh = function (force) {
            if (force == true) {
                HighlightService.clear();
            }
            HighlightService.query().then(
                function (data) {
                    $scope.highlights = data;
                    $scope.$broadcast('scroll.refreshComplete');
                },
                function (data) {
                    console.log("Falhou " + JSON.stringify(data));
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

        $scope.doRefresh();
    })
    .controller('MenuCtrl', function ($scope, $stateParams, $state, EtapasService, $rootScope) {
        $scope.menuBtns = [];
        $rootScope.rightMenuButtons = [];
        $scope.$on('$stateChangeSuccess', function (next, current) {
            if (current && $rootScope.rightMenuButtons) {
                $scope.menuBtns = $rootScope.rightMenuButtons[current.name];
                $scope.nome = current.name;
            }

        });
        $rootScope.$on('addRight', function (event, obj) {

            $rootScope.addBtns(obj.state, obj.btns);
        })
        $rootScope.addBtns = function (stateName, btns) {

            console.log("adding", stateName, $rootScope.rightMenuButtons[stateName], btns, $stateParams, $state, $stateParams.current);
            $rootScope.rightMenuButtons[stateName] = btns;
            if ($state.current && $state.current.name == stateName) {
                $scope.menuBtns = btns;
            }
        }

    })
    .controller('MudaSenhaCtrl', function ($scope, $state, loginService, $ionicModal, UserService, $log, $rootScope, $ionicPopup) {
        $scope.user = loginService.getUser();
        $scope.pwdForm = {};
        $scope.doUpdatePwd = function () {
            if ($scope.pwdForm.newPwd != $scope.pwdForm.newPwdVerify) {
                $scope.errorMsg = "Confirmação de senha diferente.";
                return;
            }
            UserService.updatePwd({}, { id: loginService.getUserID(), oldPwd: $scope.pwdForm.oldPwd, newPwd: $scope.pwdForm.newPwd }, function () {
                $state.go('app.profile');
            }, function (response) {
                if (response.data.error) {
                    switch (response.data.errorCode) {
                        case 804:
                            $scope.errorMsg = "Senha atual inválida.";
                            break;
                        case 803:
                            $scope.errorMsg = "Você não possui senha atualmente, por favor utilize o botão para resetar e gerar uma nova senha.";
                            break;

                        default:
                            $scope.errorMsg = "Houve um problema para atualizar sua senha. Confirme sua senha anterior. A senha nova deve ter pelo menos 2 caracteres.";
                    }

                } else {
                    $scope.errorMsg = "Houve um problema para atualizar sua senha. Confirme sua senha anterior. A senha nova deve ter pelo menos 2 caracteres.";
                }
            });
        }
        $scope.resetPassword = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Lembrar senha',
                template: 'Um e-mail será enviado para executar o reset de sua senha. Desenha continuar?'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    loginService.startPwdRecovery($scope.user.email);
                } else {

                }
            });
        };
    })
    .controller('ProfileCtrl', function ($scope, $cordovaFacebook, $state, loginService, $ionicModal, UserService, $log, $rootScope, $ionicPopup, EquipesService) {
        $scope.mudarSenha = function () {
            $state.go('app.mudarsenha');
        }
        $scope.user = loginService.getUser();
        if ($scope.user == null) {
            $scope.user = {};
        } else {
            $rootScope.$emit("addRight", { state: "app.profile", btns: [{ icon: "ion-android-more-vertical", callback: $scope.mudarSenha }] });
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

            $scope.showForm = true;
        }

        $scope.loginData = {};
        $scope.executeLogin = function () {

            $scope.loginData.errorMsg = "";
            loginService.login($scope.loginData.username, $scope.loginData.password).then(
                function (userInfo) {
                    $scope.closeLogin();
                    $scope.user = userInfo;
                    loginService.setUserLocally($scope.user);

                },
                function (error) {
                    console.log(error);

                    switch (error.status) {
                        case 404:
                            $scope.loginData.errorMsg = "Usuário não encontrado. Crie uma conta com este e-mail para se conectar.";
                            break;
                        case 403:
                            $scope.loginData.errorMsg = "Usuário ou senha incorreto.";
                            break;
                        case 401:
                            $scope.loginData.errorMsg = "Sua conta está associada ao Facebook. Utilize a conexão com Facebook OU reset sua senha com o botão lembrar senha abaixo.";
                            break;

                        default:
                            $scope.loginData.errorMsg = "Usuário ou senha incorretos.";
                            break;
                    }



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
            EquipesService.clear();

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
        $scope, $stateParams, WeatherService, tab, EtapasService, LocationService, $location, $ionicBackdrop, $timeout, $rootScope, $ionicHistory, $cordovaInAppBrowser, $localStorage, $log, UtilsService, $cordovaLaunchNavigator, $ionicLoading) {
        $scope.doRefresh = function () {
            switch ($scope.currTab) {
                case 'grid':
                    EtapasService.clear();
                    break;

                default:
                    break;
            }
            $scope.setTab($scope.currTab);
        }

        console.log($stateParams, tab);
        $scope.currTab = "details";
        if (tab) {
            $scope.currTab = tab;
        }
        $scope.tabstemplate = "templates/etapa.tabs.html";
        $scope.etapaNotComplete = true;

        $scope.categorias = UtilsService.getCategorias();
        $scope.getLastSelectedCat = function () {
            var selectedCat = UtilsService.getCategorias()[0].id;
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
        $scope.getLabelCategoria = UtilsService.getLabelCategoria;
        $scope.isInCategoria = function (categoriaGrid) {
            return function (item) {
                if ((item.id_Categoria == 1 || item.id_Categoria == 2)) {
                    return categoriaGrid.id_Config == 1;
                }
                return categoriaGrid.id_Config == item.id_Categoria;
            };
        }

        $scope.setTab = function (tabName) {
            $scope.currTab = tabName;
            if ($scope.currTab == "grid") {
                EtapasService.getGrid({ id: $scope.etapa.id }).then(function (data) {
                    $scope.inscricaoInfo = data;
                    $scope.$broadcast('scroll.refreshComplete');;
                });
            } else if ($scope.currTab == "results") {
                EtapasService.getResultados($scope.etapa).then(function (data) {
                    $scope.resultados = data;
                    $scope.$broadcast('scroll.refreshComplete');;
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
            $scope.etapaNotComplete = $scope.etapa.data < new Date().getTime();
            if (dadosEtapa.id_Local) {
                LocationService.get({ id: $scope.etapa.id_Local }).then(function (location) {
                    $scope.etapa.location = location;
                    if (location.latitude != null) {
                        var lat = parseFloat(location.latitude) / 1000000;
                        var lng = parseFloat(location.latitude) / 1000000;

                        WeatherService.getPerCoords(lat, lng, dadosEtapa.data).then(
                            function (weather) {
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
            $ionicLoading.show({
                template: 'Abrindo navegador...'
            });
            $timeout($ionicLoading.hide, 2000);


            $cordovaInAppBrowser.open(website, '_blank')
                .then(function (event) {
                    $ionicLoading.hide();
                })
                .catch(function (event) {
                    $ionicLoading.hide();
                });

        }
        $scope.openInscricao = function () {
            $ionicLoading.show({
                template: 'Abrindo navegador...'
            });
            $timeout($ionicLoading.hide, 2000);
            $cordovaInAppBrowser.open("http://cumeqetrekking.appspot.com/open/index.html", '_blank', { 'location': 'yes' })
                .then(function (event) {
                    // success
                    $ionicLoading.hide();
                })
                .catch(function (event) {
                    // error
                    console.log("falhou " + event)
                    $ionicLoading.hide();
                });
        }
        $scope.maps = function (etapa) {


            if (etapa.location.latitude != null) {
                var lat = (etapa.location.latitude / 1000000);
                var lng = (etapa.location.longitude / 1000000);
                $cordovaLaunchNavigator.navigate([lat, lng])
                    .then(
                        function () {
                            console.log("chamou roteador");
                        }, function (error) {
                            console.log("erro " + error);
                        }

                        )

            } else {
                $cordovaLaunchNavigator.navigate(etapa.location.endereco);
            }

        }
    })
    .controller('EtapasCtrl', function (
        $scope, $stateParams, WeatherService, EtapasService, LocationService, $location, $anchorScroll, $ionicScrollDelegate) {

        $scope.doRefresh = function () {
            EtapasService.clear();
            $scope.loadData();
        }
        $scope.getEtapaImg = function (etapa) {
            if (etapa.active == true) {
                return "img/etapa_atual.jpg"
            } else {
                if (etapa.data < new Date().getTime()) {
                    return "img/etapa_completa.jpg"
                } else {
                    return "img/etapa_futura.jpg"
                }
            }
        }

        $scope.loadData = function () {
            EtapasService.query().then(function (data) {
                $scope.etapas = data;
                $scope.$broadcast('scroll.refreshComplete');

                for (var index = 0; index < $scope.etapas.length; index++) {
                    var element = $scope.etapas[index];
                    //até 2 dias seguintes a etapa deve-se centralizar nela
                    if (element.active == 1) {
                        $scope.etapa = element;
                    }
                    if (element.id_Local) {
                        LocationService.get({ id: element.id_Local }).then(function (data) {
                            for (var index = 0; index < $scope.etapas.length; index++) {
                                var element = $scope.etapas[index];
                                if (element.id_Local == data.id) {
                                    $scope.etapas[index].location = data;
                                    return;
                                }

                            }

                        });
                    }
                }

                $location.hash($scope.etapa.id);
                // $anchorScroll();
                $ionicScrollDelegate.anchorScroll()
            }, function () {
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        console.log("Entrou no etapas");
        $scope.loadData();

    })

    .controller('RankingCtrl', function ($scope, $stateParams, $localStorage, RankingService, EquipesService, UtilsService) {

        $scope.doRefresh = function (forceClean) {
            if (forceClean == true) {
                RankingService.clear();
            }
            RankingService.query().then(function (data) {
                $scope.results = data;
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        $scope.allCompetidores = {};
        EquipesService.getMembers({}).then(function (data) {
            for (var index = 0; index < data.length; index++) {
                var element = data[index];
                if (!$scope.allCompetidores[element.id_Equipe]) {
                    $scope.allCompetidores[element.id_Equipe] = [];
                }
                $scope.allCompetidores[element.id_Equipe].push(element);
            }
        });

        $scope.carregaCompetidores = function (equipe) {

            return $scope.allCompetidores[equipe.id_Equipe];
        }

        $scope.doRefresh();

        $scope.categorias = UtilsService.getCategorias();
        $scope.getLastSelectedCat = function () {
            var selectedCat = UtilsService.getCategorias()[0].id;
            if ($localStorage.lastSelectedCat) {
                selectedCat = $localStorage.lastSelectedCat;
            }

            return { id_Categoria: selectedCat };
        }

        $scope.updatePrefCategoria = function (idCat) {
            if (idCat != null) {
                $localStorage.lastSelectedCat = idCat;
            }
        }

    });
