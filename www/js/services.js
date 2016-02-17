angular.module('north.services', ['ionic', 'ngCordova', 'ngStorage','ngResource'])
 .factory('EtapasService', function ($http, $localStorage,$resource) {
        return $resource("http://www.mocky.io/v2/56c3edb6110000861e2824a3");
                
            

    })
.factory('GridService', function ($http, $localStorage,$resource) {
    return $resource('http://www.mocky.io/v2/56c3e97b110000201d2824a2',
        {},
        {
            query:{
                isArray:false
            }
        }
    
    );
        // return {
        //     query: function () {
        //         var grid = [
        //             {
        //                 time: 1456052400000,
        //                 team: {
        //                     name: "Anta"
        //                 }
        //             },
        //             {
        //                 time: 1456052460000,
        //                 team: {
        //                     name: "Associação Sabesp"
        //                 }
        //             },
        //             {
        //                 time: 1456052520000,
        //                 team: {
        //                     name: "TTT"
        //                 }
        //             }
        //         ]
        //         return grid;
        //     },
        //     queryPreGrid: function () {
        //         var grid = [{

        //             team: {
        //                 name: "CALANGO NA TRILHA	"
        //             }
        //         },
        //             {

        //                 team: {
        //                     name: "TENTEQUELESENTEFESTES"
        //                 }
        //             },
        //             {

        //                 team: {
        //                     name: "C.S.I. NA TRILHA"
        //                 }
        //             }
        //         ]
        //         return grid;
        //     },

        // }
    })