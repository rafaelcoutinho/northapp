angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
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

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('HighlightCtrl', function($scope) {
  
})

.controller('EtapasCtrl', function($scope,$stateParams) {
	console.log("entrou")
  $scope.etapas = [
    { title: '1a. Etapa',location:'Jarinu/SP',desc:'Parque Danape', date:'21/02/16', id: 1, img:'img/random/trek01.png' ,imgFull:'img/random/trek01_full.png', descFull:'Foi dada a largada para o maior Enduro a Pé do Brasil! A primeira etapa da COPA NORTH de Enduro a Pé 2016 acontece no dia 21 de fevereiro. E dessa vez quem recebe a prova de abertura é o Parque D\'Anape, na cidade de Jarinu.' },
    { title: '2a. Etapa',location:'Local a definir',desc:'',date:'03/04/16', id: 2, img:'img/random/trek02.png' },
    { title: '3a. Etapa',location:'Local a definir',desc:'Night Trekking',date:'14/05/16', id: 3, img:'img/random/night.png' },
    { title: '4a. Etapa',location:'Local a definir',desc:'Sem equipamentos', date:'19/06/16',id: 4, img:'img/random/etapaTemp.png' },
    { title: '5a. Etapa',location:'Local a definir',desc:'Enduro Julino',date:'31/07/16', id: 5 , img:'img/random/etapaTemp.png' },
    { title: '6a. Etapa',location:'Local a definir',desc:'',date:'18/09/16', id: 6, img:'img/random/etapaTemp.png' },
    { title: '7a. Etapa',location:'Local a definir',desc:'Enduro noturno halloween',date:'22/10/16', id: 7 , img:'img/random/etapaTemp.png' },
    { title: '8a. Etapa',location:'Local a definir',desc:'Sem equipamentos', date:'27/11/16',id: 8 , img:'img/random/etapaTemp.png' }
    
    
  ];
	if($stateParams.id){
		$scope.etapa = $scope.etapas[$stateParams.id-1];
	}
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
