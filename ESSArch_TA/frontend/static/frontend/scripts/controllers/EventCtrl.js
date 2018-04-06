/*
    ESSArch is an open source archiving and digital preservation system

    ESSArch Tools for Archive (ETA)
    Copyright (C) 2005-2017 ES Solutions AB

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.

    Contact information:
    Web - http://www.essolutions.se
    Email - essarch@essolutions.se
*/

angular.module('myApp').controller('EventCtrl', ['Resource', '$scope', '$rootScope', 'listViewService','$interval','appConfig', '$cookies', '$window', '$translate', '$http', 'Notifications', function (service, $scope, $rootScope, listViewService, $interval, appConfig, $cookies, $window, $translate, $http, Notifications) {
    var vm = this;
    vm.itemsPerPage = $cookies.get('eta-events-per-page') || 10;
    $scope.updateEventsPerPage = function(items) {
        $cookies.put('eta-events-per-page', items);
    };
    $scope.selected = [];
    vm.displayed = [];
    $scope.addEventAlert = null;
    $scope.alerts = {
        addEventError: { type: 'danger', msg: 'ERROR_MESSAGE' },
        addEventSuccess: { type: 'success', msg: 'EVENT_ADDED' }
    };

    vm.$onInit = function() {
        $scope.ip = vm.ip;
        vm.getEventlogData();
        $http({
            method: "OPTIONS",
            url: appConfig.djangoUrl + "events/"
        }).then(function(response) {
            $scope.usedColumns = response.data.filters;
        })
    }
    vm.$onChanges = function() {
        $scope.addEventAlert = null;
        $scope.ip = vm.ip;
        if($scope.stCtrl) {
            $scope.stCtrl.pipe();
        }
    }
    //Get data for eventlog view
    vm.getEventlogData = function() {
        listViewService.getEventlogData().then(function(value){
            vm.eventTypeCollection = value;
        });
    };

    $scope.closeAlert = function() {
        $scope.addEventAlert = null;
    }
    $scope.$on('$stateChangeStart', function() {
        $interval.cancel(eventInterval);
    });
    $scope.$on("$destroy", function() {
        $interval.cancel(eventInterval);
    });
    $scope.newEventForm = {
        eventType: "",
        eventOutcome: "",
        comment: ""
    };
    $scope.eventLevels = {
        0: 'Success',
        1: 'Failure'
    };
    $scope.getEventOutcome = function(outcome) {
        level = $scope.eventLevels[outcome];
        return level.charAt(0).toUpperCase() + level.slice(1)
    }
    $scope.eventOutcomes = function(){
        levels = $scope.eventLevels;
        return Object.keys(levels).map(function(k) {
            return {value: k, name: levels[k]};
        });
    }()
    //Event click funciton
    $scope.eventClick = function(row) {
        if(row.class == "selected"){
            row.class = "";
            for(i=0; i<$scope.selected.length; i++){
                if($scope.selected[i].id === row.id){
                    $scope.selected.splice(i,1);
                }
            }
        } else {
            row.class = "selected";
            $scope.selected.push(row);
        }
    };
    $scope.addEvent = function(ip, eventType, eventDetail, eventOutcome) {
        $scope.addEventAlert = null;
        listViewService.addEvent(ip, eventType, eventDetail, eventOutcome).then(function(value) {
            $scope.stCtrl.pipe();
            $scope.newEventForm = {
                eventType: "",
                eventOutcome: "",
                comment: ""
            };
            Notifications.add($translate.instant('EVENT_ADDED'), "success");
        }).catch(function error() {
            Notifications.add($translate.instant('ERROR_MESSAGE'), "error");
        });
    }

    var eventInterval;
    function updateEvents() {
        $interval.cancel(eventInterval);
        eventInterval = $interval(function() {
            $scope.stCtrl.pipe();
        }, appConfig.eventInterval);
    }
    updateEvents();
    //Get data from rest api for event table
    $scope.eventPipe = function(tableState, ctrl) {
        $scope.eventLoading = true;
        if(vm.displayed.length == 0) {
            $scope.initLoad = true;
        }
        var search = "";
        if(tableState.search.predicateObject) {
            var search = tableState.search.predicateObject["$"];
        }
        $scope.stCtrl = ctrl;
        var sorting = tableState.sort;
        var pagination = tableState.pagination;
        var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
        var number = pagination.number || vm.itemsPerPage;  // Number of entries showed per page.
        var pageNumber = start/number+1;

        service.getEventPage(start, number, pageNumber, tableState, $scope.selected, sorting, $scope.columnFilters, search).then(function (result) {
            vm.displayed = result.data;
            tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
            $scope.tableState = tableState;
            $scope.eventLoading = false;
            $scope.initLoad = false;
        }).catch(function(response) {
            if(response.status == 404) {
                listViewService.checkPages("events", number, $scope.columnFilters).then(function (result) {
                    tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
                    tableState.pagination.start = (result.numberOfPages*number) - number;
                    $scope.stCtrl.pipe();
                });
            }
        })
    };

      //advanced filter form data
      $scope.columnFilters = {};
      $scope.filterModel = {};
      $scope.options = {};
      $scope.fields = [];
      vm.setupForm = function() {
          $scope.fields = [];
          $scope.filterModel = {};
           for(var key in $scope.usedColumns) {
               var column = $scope.usedColumns[key];
               switch(column.type) {
                   case "ModelChoiceFilter":
                   case "ChoiceFilter":
                      $scope.fields.push({
                          "templateOptions": {
                              "type": "text",
                              "label": $translate.instant(key.toUpperCase()),
                              "labelProp": "display_name",
                              "valueProp": "value",
                              "options": column.choices,
                          },
                          "type": "select",
                          "key": key,
                      })
                   break;
                   case "CharFilter":
                      $scope.fields.push({
                          "templateOptions": {
                              "type": "text",
                              "label": $translate.instant(key.toUpperCase()),
                              "labelProp": key,
                              "valueProp": key,
                          },
                          "type": "input",
                          "key": key,
                      })
                   break;
                   case "IsoDateTimeFromToRangeFilter":
                   $scope.fields.push(
                      {
                          "templateOptions": {
                              "type": "text",
                              "label": $translate.instant(key.toUpperCase()+"_START"),
                          },
                          "type": "datepicker",
                          "key": key + "_0"
                      }
                   )
                   $scope.fields.push(
                      {
                          "templateOptions": {
                              "type": "text",
                              "label": $translate.instant(key.toUpperCase()+"_END"),
                          },
                          "type": "datepicker",
                          "key": key + "_1"
                      }
                   )
                   break;
               }
           }
      }

      //Toggle visibility of advanced filters
      $scope.toggleAdvancedFilters = function () {
          if ($scope.showAdvancedFilters) {
              $scope.showAdvancedFilters = false;
          } else {
              if ($scope.fields.length <=0) {
                  vm.setupForm();
              }
              $scope.showAdvancedFilters = true;
          }
           if ($scope.showAdvancedFilters) {
               $window.onclick = function (event) {
                   var clickedElement = $(event.target);
                   if (!clickedElement) return;
                   var elementClasses = event.target.classList;
                   var clickedOnAdvancedFilters = elementClasses.contains('filter-icon') ||
                   elementClasses.contains('advanced-filters') ||
                   clickedElement.parents('.advanced-filters').length ||
                   clickedElement.parents('.button-group').length;

                   if (!clickedOnAdvancedFilters) {
                       $scope.showAdvancedFilters = !$scope.showAdvancedFilters;
                       $window.onclick = null;
                       $scope.$apply();
                   }
               }
           } else {
               $window.onclick = null;
           }
      }

      $scope.clearSearch = function() {
          delete $scope.tableState.search.predicateObject;
          $('#event-search-input')[0].value = "";
          $scope.stCtrl.pipe();
      }

      $scope.filterActive = function() {
          var temp = false;
          for(var key in $scope.columnFilters) {
              if($scope.columnFilters[key] !== "" && $scope.columnFilters[key] !== null) {
                  temp = true;
              }
          }
          return temp;
      }

      $scope.submitAdvancedFilters = function() {
          $scope.columnFilters = angular.copy($scope.filterModel);
          $scope.stCtrl.pipe();
      }

      // Click function for request form submit.
      // Replaced form="vm.requestForm" to work in IE
      $scope.clickSubmit = function () {
          if (vm.requestForm.$valid) {
              $scope.submitRequest($scope.ip, vm.request);
          }
      }
}]);
