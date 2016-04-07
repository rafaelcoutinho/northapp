(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['angular'], factory);
    } else if (root.hasOwnProperty('angular')) {
        // Browser globals (root is window), we don't register it.
        factory(root.angular);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('angular'));
    }
    
} (this, function (angular) {
    'use strict';
    
    function CacheEntry(url, params, actions, cacheParams, $localStorage, $q, $resource, $log, $timeout) {
        this.res = $resource(url,params,actions);
        this.cacheTimeout = cacheParams.cacheTimeout*1000*60;//minutes
        if(!this.cacheTimeout){
            this.cacheTimeout=-1;
        }
        this.cacheHalfLife=cacheParams.cacheHalfLife;
        
        this.name = cacheParams.name;
        if(this.name==null||this.name.length==0){
            throw "Cache name is mandatory";
        }
      
         $log.debug("creating cached resource",url,this.name,this.cacheTimeout);
         var forEach = angular.forEach;
         var me = this;
         if(!$localStorage[this.name]){
             $localStorage[this.name]={};
         }
         this.clear = function(){
             delete $localStorage[this.name];
             $localStorage[this.name]={};
         }
         if(!actions["get"]){
             actions["get"]={method: 'GET'};
         }
           if(!actions["query"]){
             actions["query"]={method: 'GET', isArray: true};
         }
         
         
         forEach(actions, function (action, nameFct) {
             me[nameFct] = function (a, b) {
                 var deferred = $q.defer();
                 
                
                    var cacheName = nameFct;
                    var cacheParams = action.cr;
                    if(!cacheParams){
                        cacheParams={};
                    }
                    if(cacheParams.cacheName){
                        cacheName=cacheParams.cacheName(a);
                        $log.debug(cacheName,me.name);                     
                    }
                    var cache = $localStorage[me.name][cacheName];
                    
                    var checkValidity = function (cacheEntry) {
                        var timeout = me.cacheTimeout;
                        if (cacheParams.isCacheValid) {
                            $log.debug("using cr_isCacheValid function timeout");
                            return cacheParams.isCacheValid(cacheEntry, params);
                        } else if (cacheParams.timeout) {
                            $log.debug("using actions timeout", cacheParams.timeout);
                            timeout = cacheParams.timeout;
                        } else {
                            $log.debug("using def constructor timeout", timeout);
                        }

                        return (timeout <= 0 || ((new Date().getTime() - cache.date) < timeout));
                    }
                    var reloadCache = function (executeCallback,onFailure) {
                        me.res[nameFct](a, b,
                            function (data) {
                                var cacheData = {
                                    data: data,
                                    date: new Date().getTime()
                                }
                                $localStorage[me.name][cacheName] = cacheData;
                                if (executeCallback) {
                                    deferred.resolve(data);
                                }
                            }, function (error) {
                                $log.log("erro", error)
                                if (executeCallback) {
                                    if(onFailure!=null){
                                        deferred.resolve(onFailure)
                                    }else{
                                        deferred.reject(error);
                                    }
                                }
                            });
                    };
                    if (cache && cache.data != null) {
                        //checar se está velho:
                        if (checkValidity(cache) == true) {
                            $log.debug("Cache hit '" + (cacheName) + "'");
                            deferred.resolve(cache.data);
                            if (cacheParams.cacheHalfLife && cacheParams.cacheHalfLife(cache)) {
                                $log.debug("Cache halflife reached");
                                reloadCache(false);
                            }
                        }else{
                            reloadCache(true,cache.data);
                        }
                        
                        
                    } else {
                        $log.debug("Cache miss '" + (cacheName) + "'");
                        reloadCache(true);
                    }
                  
                // }  ,1);
                  return deferred.promise;

             }
         });
        
    };
    // In cases where Angular does not get passed or angular is a truthy value
    // but misses .module we can fall back to using window.
    angular = (angular && angular.module) ? angular : window.angular;

    /**
     * @ngdoc overview
     * @name ngStorage
     */

    return angular.module('rcCachedResource', ['ngStorage', 'ngResource'])

    /**
     * @ngdoc object
     * @name ngStorage.$localStorage
     * @requires $rootScope
     * @requires $window
     */

        .provider('$cachedResource', _cachedStorageProvider())
    function _cachedStorageProvider() {
        return function () {
            this.$get = [
                '$rootScope',
                '$window',
                '$log',
                '$timeout',
                '$document',
                '$localStorage',
                '$resource',
                '$q',
                function (
                    $rootScope,
                    $window,
                    $log,
                    $timeout,
                    $document,
                    $localStorage,                    
                    $resource,
                    $q
                    ) {                       
                        function cachingFactory(url,params,actions,cacheParams) {                            
                            return new CacheEntry(url,params,actions,cacheParams,$localStorage,$q,$resource,$log,$timeout);
                        }
                 
                    return cachingFactory;
                }
            ]};
    }
}));