angular.module('north.services', ['ionic', 'ngCordova', 'ngStorage'])
.factory('GridService', function ($http, $localStorage) {
        return {
            query: function () {
                var grid = [
                    {
                        time: 1456052400000,
                        team: {
                            name: "Anta"
                        }
                    },
                    {
                        time: 1456052460000,
                        team: {
                            name: "Associação Sabesp"
                        }
                    },
                    {
                        time: 1456052520000,
                        team: {
                            name: "TTT"
                        }
                    }
                ]
                return grid;
            },
            queryPreGrid: function () {
                var grid = [{

                    team: {
                        name: "CALANGO NA TRILHA	"
                    }
                },
                    {

                        team: {
                            name: "TENTEQUELESENTEFESTES"
                        }
                    },
                    {

                        team: {
                            name: "C.S.I. NA TRILHA"
                        }
                    }
                ]
                return grid;
            },

        }
    })