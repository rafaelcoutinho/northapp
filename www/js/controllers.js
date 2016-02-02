angular.module('starter.controllers', [ 'ionic', 'ngCordova', 'ngStorage'
])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, $timeout, $ionicPush, $cordovaLocalNotification) {

	if ($scope.shide != true) {
		if (navigator && navigator.splashscreen) {
			navigator.splashscreen.hide();
			$scope.shide = true;
		} else {
			console.log("Nao achou splashscreen, vai faze-lo novamente mais tarde..")
			window.setTimeout(function() {
				if (navigator && navigator.splashscreen) {
					navigator.splashscreen.hide();
					$scope.shide = true;
				} else {
					console.log("Nao achou novamente splashscreen, timeout padrao sendo utilizado..")
				}
			}, 3000);
		}
	}

	// this will give you a fresh user or the previously saved
	// 'current user'
	var user = Ionic.User.current();

	// if the user doesn't have an id, you'll need to give it
	// one.
	if (!user.id) {
		user.id = Ionic.User.anonymousId();
		// user.id = 'your-custom-user-id';
	}

	// persist the user
	user.save();
	// With the new view caching in Ionic, Controllers are only
	// called
	// when they are recreated or on app start, instead of every
	// page change.
	// To listen for when this page is active (for example, to
	// refresh data),
	// listen for the $ionicView.enter event:
	// $scope.$on('$ionicView.enter', function(e) {
	// });

	// Form data for the login modal
	$scope.loginData = {};

	// Create the login modal that we will use later
	$ionicModal.fromTemplateUrl('templates/login.html', {
		scope : $scope
	}).then(function(modal) {
		$scope.modal = modal;
	});

	// Triggered in the login modal to close it
	$scope.closeLogin = function() {
		$scope.modal.hide();
	};

	// Open the login modal
	$scope.login = function() {
		$scope.modal.show();
	};

	// Perform the login action when the user submits the login
	// form
	$scope.doLogin = function() {
		console.log('Doing login', $scope.loginData);

		// Simulate a login delay. Remove this and replace with
		// your login
		// code if using a login system
		$timeout(function() {
			$scope.closeLogin();
		}, 1000);
	};
})

.controller('HighlightCtrl', function($scope) {

}).factory('loginService', function($http, $localStorage) {

	return {
		setUser : function(aUser) {
			$localStorage.user = aUser;
			this.reloadIonicUser(aUser);
		},
		reloadIonicUser : function(user) {
			try {

				var ionicUser = Ionic.User.load(user.id).then(function(data) {
					console.log(data + "Carregou usuario do ionico " + JSON.stringify(ionicUser));

				}, function(erro) {
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

						ionicUser.save().then(function(a) {
							console.log("salvou no ionic " + a)
						}, function(err) {
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
		getUser : function() {
			var user = $localStorage.user != null ? $localStorage.user : null;

			return user;
		},
		getUserID : function() {
			return this.getUser() == null ? null : this.getUser().id;
		},
		isLoggedIn : function() {
			return ($localStorage.user) ? $localStorage.user : false;
		}
	};
}).controller('ProfileCtrl', function($scope, $cordovaFacebook, loginService) {
	$scope.user = loginService.getUser();
	
	$scope.getfbinfo = function() {
		$cordovaFacebook.api("me", [ "email","user_friends"]).then(function(success) {
			// success
			console.log("public " + JSON.stringify(success));
			$scope.logUserIn(success);
		}, function(error) {
			// error
			$scope.login_error = 'Erro carregando informações do Facebook';
		});
	};
	if ($scope.user != null) {
		$scope.getfbinfo();
	}
	$scope.doLoginFB = function() {

		$cordovaFacebook.login([ "public_profile",  "email"
		]).then(function(user) {
			console.log("sucesso " + JSON.stringify(user));
			if (user.email) {
				$scope.logUserIn(user);
			} else {
				$scope.getfbinfo();
			}

		}, function(error) {
			console.log("error " + JSON.stringify(error));
			$scope.login_error = 'Erro logando com Facebook';
		});

	}
	$scope.logUserIn = function(user) {
		console.log("pegou usuario user " + JSON.stringify(user))
		var localUser = {
			email : user.email,
			name : user.name,
			fbId : user.id,
			image : "http://graph.facebook.com/" + user.id + "/picture?width=128&height=128",
			id : user.id

		}
		loginService.setUser(localUser);
		$scope.user = loginService.getUser();
	};

})

.controller('EtapasCtrl', function($scope, $stateParams) {
	console.log("entrou")
	$scope.etapas = [ {
		title : '1a. Etapa',
		location : 'Jarinu/SP',
		desc : 'Parque Danape',
		date : '21/02/16',
		id : 1,
		img : 'img/random/trek01.png',
		imgFull : 'img/random/trek01_full.png',
		descFull : 'Foi dada a largada para o maior Enduro a Pé do Brasil! A primeira etapa da COPA NORTH de Enduro a Pé 2016 acontece no dia 21 de fevereiro. E dessa vez quem recebe a prova de abertura é o Parque D\'Anape, na cidade de Jarinu.'
	}, {
		title : '2a. Etapa',
		location : 'Local a definir',
		desc : '',
		date : '03/04/16',
		id : 2,
		img : 'img/random/trek02.png'
	}, {
		title : '3a. Etapa',
		location : 'Local a definir',
		desc : 'Night Trekking',
		date : '14/05/16',
		id : 3,
		img : 'img/random/night.png'
	}, {
		title : '4a. Etapa',
		location : 'Local a definir',
		desc : 'Sem equipamentos',
		date : '19/06/16',
		id : 4,
		img : 'img/random/etapaTemp.png'
	}, {
		title : '5a. Etapa',
		location : 'Local a definir',
		desc : 'Enduro Julino',
		date : '31/07/16',
		id : 5,
		img : 'img/random/etapaTemp.png'
	}, {
		title : '6a. Etapa',
		location : 'Local a definir',
		desc : '',
		date : '18/09/16',
		id : 6,
		img : 'img/random/etapaTemp.png'
	}, {
		title : '7a. Etapa',
		location : 'Local a definir',
		desc : 'Enduro noturno halloween',
		date : '22/10/16',
		id : 7,
		img : 'img/random/etapaTemp.png'
	}, {
		title : '8a. Etapa',
		location : 'Local a definir',
		desc : 'Sem equipamentos',
		date : '27/11/16',
		id : 8,
		img : 'img/random/etapaTemp.png'
	}

	];
	if ($stateParams.id) {
		$scope.etapa = $scope.etapas[$stateParams.id - 1];
	}
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
