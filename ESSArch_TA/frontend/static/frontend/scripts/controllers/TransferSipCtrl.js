angular.module('myApp').controller('TransferSipCtrl', function($http, $scope, $rootScope, $state, $log, listViewService, Resource, $translate, $interval, $uibModal, appConfig, $timeout, $anchorScroll, PermPermissionStore) {
    $rootScope.$on('$translateChangeSuccess', function () {
        $state.reload()
    });
    $scope.$watch(function(){return $rootScope.navigationFilter;}, function(newValue, oldValue) {
        $scope.getListViewData();
    }, true);
    $scope.statusShow = false;
    $scope.eventShow = false;
    $scope.tree_data = [];
    $translate(['LABEL', 'RESPONSIBLE', 'DATE', 'STATE', 'STATUS']).then(function(translations) {
        $scope.responsible = translations.RESPONSIBLE;
        $scope.label = translations.LABEL;
        $scope.date = translations.DATE;
        $scope.state = translations.STATE;
        $scope.status = translations.STATUS;
        $scope.expanding_property = {
            field: "name",
            displayName: $scope.label,
        };
        $scope.col_defs = [
        {
            field: "user",
            displayName: $scope.responsible,
        },
        {
            field: "time_created",
            displayName: $scope.date
        },
        {
            field: "status",
            displayName: $scope.state,
            cellTemplate: "<div ng-if=\"row.branch[col.field] == 'SUCCESS'\" class=\"step-state-success\"><b>{{'SUCCESS' | translate}}</b></div><div ng-if=\"row.branch[col.field] == 'FAILURE'\" class=\"step-state-failure\"><b>{{'FAILURE' | translate}}</b></div><div ng-if=\"row.branch[col.field] != 'SUCCESS' && row.branch[col.field] !='FAILURE'\" class=\"step-state-in-progress\"><b>{{'INPROGRESS' | translate}}</b></div>"

        },
        {
            field: "progress",
            displayName: $scope.status,
            cellTemplate: "<uib-progressbar class=\"progress\" value=\"row.branch[col.field]\" type=\"success\"><b>{{row.branch[col.field]+\"%\"}}</b></uib-progressbar>"
        },
        {
            cellTemplate: "<a ng-click=\"treeControl.scope.taskStepUndo(row.branch)\" ng-if=\"(row.branch.status == 'SUCCESS' || row.branch.status == 'FAILURE') && !row.branch.undone && !row.branch.undo_type\" style=\"color: #a00\">{{'UNDO' | translate}}</a></br ><a ng-click=\"treeControl.scope.taskStepRedo(row.branch)\" ng-if=\"row.branch.undone\"style=\"color: #0a0\">{{'REDO' | translate}}</a>"
        }
        ];
    });
    var stateInterval;
    $scope.stateClicked = function(row){
        if($scope.statusShow && $scope.ip == row){
            $scope.statusShow = false;
        } else {
             $scope.eventShow = false;
             $scope.validateShow = false;
             $scope.statusShow = true;
             $scope.statusViewUpdate(row);
         }
         $scope.ip = row;
         $rootScope.ip = row;
     };
     $scope.$watch(function(){return $scope.statusShow;}, function(newValue, oldValue) {
         if(newValue) {
             $interval.cancel(stateInterval);
             stateInterval = $interval(function(){$scope.statusViewUpdate($scope.ip)}, appConfig.stateInterval);
        } else {
            $interval.cancel(stateInterval);
        }
     });
     $rootScope.$on('$stateChangeStart', function() {
         $interval.cancel(stateInterval);
        $interval.cancel(listViewInterval);
     });

//Get data for status view
     function checkExpanded(nodes) {
         var ret = [];
         nodes.forEach(function(node) {
             if(node.expanded == true) {
                ret.push({id: node.id, name: node.name});
            }
            if(node.children && node.children.length > 0) {
                ret = ret.concat(checkExpanded(node.children));
            }
        });
        return ret;
    }
    //Update status view data
    $scope.statusViewUpdate = function(row){
        $scope.statusLoading = true;
        var expandedNodes = [];
        if($scope.tree_data != []) {
            expandedNodes = checkExpanded($scope.tree_data);
        }
        listViewService.getTreeData(row, expandedNodes).then(function(value) {
            $scope.tree_data = value;
            $scope.statusLoading = false;
        });
    };
    /*
     * EVENTS
     */
    $scope.eventsClick = function (row) {
        if($scope.eventShow && $scope.ip == row){
            $scope.eventShow = false;
            $rootScope.stCtrl = null;
        } else {
            if($rootScope.stCtrl) {
                $rootScope.stCtrl.pipe();
            }
            getEventlogData();
            $scope.eventShow = true;
            $scope.validateShow = false;
            $scope.statusShow = false;
        }
        $scope.ip = row;
        $rootScope.ip = row;
    };
    function getEventlogData() {
        listViewService.getEventlogData().then(function(value){
            $scope.eventTypeCollection = value;
        });
    };

    $scope.currentStepTask = {id: ""}
    //Click funciton for steps and tasks
    $scope.stepTaskClick = function(branch) {
        $http({
            method: 'GET',
            url: branch.url
        }).then(function(response){
                $scope.currentStepTask = response.data;
            if(branch.isTask){
                $scope.taskInfoModal();
            } else {
                $scope.stepInfoModal();
            }
        }, function(response) {
            response.status;
        });
    };
    //Creates and shows modal with task information
    $scope.taskInfoModal = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/task_info_modal.html',
            scope: $scope,
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        });
        modalInstance.result.then(function (data, $ctrl) {
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
    //Creates and shows modal with step information
    $scope.stepInfoModal = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/step_info_modal.html',
            scope: $scope,
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        });
        modalInstance.result.then(function (data, $ctrl) {
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
    /*******************************************/
    /*Piping and Pagination for List-view table*/
    /*******************************************/
    var vm = this;
    var ctrl = this;
    this.itemsPerPage = 10;
    $scope.selectedIp = {id: "", class: ""};
    this.displayedIps = [];

    //Get data according to ip table settings and populates ip table
    this.callServer = function callServer(tableState) {
        $scope.ipLoading = true;
        if(vm.displayedIps.length == 0) {
            $scope.initLoad = true;
        }
        if(!angular.isUndefined(tableState)) {
            $scope.tableState = tableState;
            var search = "";
            if(tableState.search.predicateObject) {
                var search = tableState.search.predicateObject["$"];
            }
            var sorting = tableState.sort;
            var pagination = tableState.pagination;
            var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
            var number = pagination.number || ctrl.itemsPerPage;  // Number of entries showed per page.
            var pageNumber = start/number+1;

            Resource.getIpPage(start, number, pageNumber, tableState, $scope.selectedIp, sorting, search, "Received,Transferring,Transferred").then(function (result) {
                ctrl.displayedIps = result.data;
                tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
                $scope.ipLoading = false;
                $scope.initLoad = true;
            });
        }
    };
    //Make ip selected and add class to visualize
    vm.displayedIps=[];
    $scope.selectIp = function(row) {
        vm.displayedIps.forEach(function(ip) {
            if(ip.id == $scope.selectedIp.id){
                ip.class = "";
            }
        });
        if(row.id == $scope.selectedIp.id && !$scope.select && !$scope.statusShow && !$scope.eventShow){
            $scope.selectedIp = {id: "", class: ""};
        } else {
            row.class = "selected";
            $scope.selectedIp = row;
        }
    };
    $scope.ipRowClick = function(row) {
        $scope.selectIp(row);
        if($scope.ip == row){
            row.class = "";
            $scope.selectedIp = {id: "", class: ""};
        }
        if($scope.eventShow) {
            $scope.eventsClick(row);
        }
        if($scope.statusShow) {
            $scope.stateClicked(row);
        }
        if ($scope.select) {
            $scope.ipTableClick(row);
        }
    }
    $scope.ipTableClick = function(row) {
        if($scope.select && $scope.ip.id== row.id){
            $scope.select = false;
        } else {
            $scope.ip = row;
            $scope.select = true;
            $scope.transferDisabled = false;
        }
        $scope.eventShow = false;
        $scope.statusShow = false;
    };
        $scope.getListViewData = function() {
            vm.callServer($scope.tableState);
        };
        var listViewInterval;
    function updateListViewConditional() {
        $interval.cancel(listViewInterval);
        listViewInterval = $interval(function() {
            var updateVar = false;
            vm.displayedIps.forEach(function(ip, idx) {
                if(ip.status < 100) {
                    if(ip.step_state != "FAILURE") {
                        updateVar = true;
                    }
                }
            });
            if(updateVar) {
                $scope.getListViewData();
            } else {
                $interval.cancel(listViewInterval);
                listViewInterval = $interval(function() {
                    var updateVar = false;
                    vm.displayedIps.forEach(function(ip, idx) {
                        if(ip.status < 100) {
                            if(ip.step_state != "FAILURE") {
                                updateVar = true;
                            }
                        }
                    });
                    if(!updateVar) {
                        $scope.getListViewData();
                    } else {
                        updateListViewConditional();
                    }

                }, appConfig.ipIdleInterval);
            }
        }, appConfig.ipInterval);
    };
    updateListViewConditional();
    $scope.transferDisabled = false;
    $scope.transferSip = function(ip) {
        $scope.transferDisabled = true;
        $http({
            method: 'POST',
            url: ip.url+"transfer/"
        }).then(function(response) {
            console.log(response);
            $scope.select = false;
            $timeout(function() {
                $scope.getListViewData();
                updateListViewConditional();
            }, 1000);
            $scope.transferDisabled = false;
        }, function(response) {
            $scope.transferDisabled = false;
        });
    }
    $scope.deliveryDescription = $translate.instant('DELIVERYDESCRIPTION');
    $scope.submitDescription = $translate.instant('SUBMITDESCRIPTION');
    $scope.package = $translate.instant('PACKAGE');
    $scope.tabsEditView = [
        {
            label: $scope.submitDescription,
            templateUrl: "static/frontend/views/reception_delivery_description.html"
        },
        {
            label: $scope.package,
            templateUrl: "static/frontend/views/reception_delivery_description.html"
        },
    ];
    $scope.colspan = 10;
    $scope.removeIpModal = function (ipObject) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/remove-ip-modal.html',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        })
        modalInstance.result.then(function (data) {
            $scope.removeIp(ipObject);
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
    //Remove and ip
    $scope.removeIp = function (ipObject) {
        $http({
            method: 'DELETE',
            url: ipObject.url
        }).then(function() {
            console.log("ip removed");
            vm.displayedIps.splice(vm.displayedIps.indexOf(ipObject), 1);
            $scope.edit = false;
            $scope.select = false;
            $scope.eventlog = false;
            $scope.eventShow = false;
            $scope.statusShow = false;

        });
    }
    $scope.tracebackModal = function (profiles) {
        $scope.profileToSave = profiles;
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/task_traceback_modal.html',
            scope: $scope,
            size: 'lg',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        })
        modalInstance.result.then(function (data) {
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
    $scope.checkPermission = function(permissionName) {
        return !angular.isUndefined(PermPermissionStore.getPermissionDefinition(permissionName));
    };
});
