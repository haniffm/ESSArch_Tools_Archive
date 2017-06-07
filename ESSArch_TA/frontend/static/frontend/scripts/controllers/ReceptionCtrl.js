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

angular.module('myApp').controller('ReceptionCtrl', function($http, $scope, $rootScope, $state, $log, listViewService, Resource, $translate, appConfig, $interval, $uibModal, $timeout, $anchorScroll, PermPermissionStore, $cookies, $controller) {
    $controller('BaseCtrl', { $scope: $scope });
    var vm = this;
    var ipSortString = "Receiving";
    $scope.ip = null;
    $rootScope.ip = null;
    vm.itemsPerPage = $cookies.get('eta-ips-per-page') || 10;
    $rootScope.$on('$translateChangeSuccess', function () {
        $state.reload()
    });
    $scope.$watch(function(){return $rootScope.navigationFilter;}, function(newValue, oldValue) {
        $scope.getListViewData();
    }, true);
    $scope.includedIps = [];
    $scope.receiveShow = false;
    $scope.validateShow = false;
    $scope.statusShow = false;
    $scope.eventShow = false;
    $scope.tree_data = [];
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
    var stateInterval;
    $scope.stateClicked = function (row) {
        if ($scope.statusShow) {
                $scope.tree_data = [];
            if ($scope.ip == row) {
                $scope.statusShow = false;
                $scope.ip = null;
                $rootScope.ip = null;
            } else {
                $scope.statusShow = true;
                $scope.edit = false;
                $scope.statusViewUpdate(row);
                $scope.ip = row;
                $rootScope.ip = row;
            }
        } else {
            $scope.statusShow = true;
            $scope.edit = false;
            $scope.statusViewUpdate(row);
            $scope.ip = row;
            $rootScope.ip = row;
        }
        $scope.subSelect = false;
        $scope.eventlog = false;
        $scope.select = false;
        $scope.eventShow = false;
    };

    /*
     * EVENTS
     */
    $scope.eventsClick = function (row) {
        if($scope.eventShow && $scope.ip == row){
            $scope.eventShow = false;
            $rootScope.stCtrl = null;
            $scope.ip = null;
            $rootScope.ip = null;
        } else {
            if($rootScope.stCtrl) {
                $rootScope.stCtrl.pipe();
            }
            getEventlogData();
            $scope.eventShow = true;
            $scope.validateShow = false;
            $scope.statusShow = false;
            $scope.ip = row;
            $rootScope.ip = row;
        }
        $scope.edit = false;
        $scope.select = false;
        $scope.statusShow = false;
    };
    function getEventlogData() {
        listViewService.getEventlogData().then(function(value){
            $scope.eventTypeCollection = value;
        });
    };

    /*******************************************/
    /*Piping and Pagination for List-view table*/
    /*******************************************/
    var ctrl = this;
    this.displayedIps = [];

    //Get data according to ip table settings and populates ip table
    this.callServer = function callServer(tableState) {
        $scope.ipLoading = true;
        if(vm.displayedIps.length == 0) {
            $scope.initLoad = true;
        }
        if(!angular.isUndefined(tableState)) {
            $scope.tableState = tableState;

            var sorting = tableState.sort;
            var pagination = tableState.pagination;
            var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
            var number = pagination.number || vm.itemsPerPage;  // Number of entries showed per page.
            var pageNumber = start/number+1;

            Resource.getReceptionIps(start, number, pageNumber, tableState, $scope.includedIps, sorting, ipSortString).then(function (result) {
                vm.displayedIps = result.data;
                tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
                $scope.ipLoading = false;
                $scope.initLoad = false;
            });
        }
    };
    //Make ip selected and add class to visualize
    vm.displayedIps=[];
    $scope.selected = [];
    $scope.receiveDisabled = false;
    $scope.receiveSip = function(ips) {
        $scope.receiveDisabled = true;
        if(ips == []) {
            return;
        }
        ips.forEach(function(ip) {
            $http({
                method: 'POST',
                url: appConfig.djangoUrl+"ip-reception/"+ip.object_identifier_value+"/receive/",
                data: {
                    validators: vm.validatorModel
                }
            }).then(function(response) {
                $scope.includedIps = [];
                $timeout(function() {
                    $scope.getListViewData();
                    updateListViewConditional();
                }, 1000);
                $scope.edit = false;
                $scope.select = false;
                $scope.eventShow = false;
                $scope.statusShow = false;
                $scope.receiveDisabled = false;
                $anchorScroll();
            }, function(response) {
                $scope.receiveDisabled = false;
            });
        });
    };
    $scope.includeIp = function(row) {
        $scope.statusShow = false;
        $scope.eventShow = false;
        var temp = true;
        $scope.includedIps.forEach(function(included) {

            if(included.object_identifier_value == row.object_identifier_value) {
                $scope.includedIps.splice($scope.includedIps.indexOf(row), 1);
                temp = false;
            }
        });
        if(temp) {
            $scope.includedIps.push(row);
        }
        if($scope.includedIps == []) {
            $scope.receiveShow = true;
        } else {
            $scope.receiveShow = false;
        }
    }
    $scope.getListViewData = function() {
        vm.callServer($scope.tableState);
        $rootScope.loadNavigation(ipSortString);
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
    $scope.ipTableClick = function(row) {
        $scope.statusShow = false;
        $scope.eventShow = false;
        if($scope.edit && $scope.ip == row) {
            $scope.edit = false;
            $scope.ip = null;
            $rootScope.ip = null;
        } else {
            vm.sdModel = {};
            if(row.state == "At reception") {
                $scope.ip = row;
                $rootScope.ip = row;
                $scope.buildSdForm(row);
                $scope.getFileList(row);
                $scope.edit = true;
            } else {
                $scope.edit = false;
                $scope.ip = null;
                $rootScope.ip = null;
            }
        }
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
            templateUrl: "static/frontend/views/reception_package.html"
        }
    ];
    $scope.colspan = 8;
    $scope.yes = $translate.instant('YES');
    $scope.no = $translate.instant('NO');
    vm.validatorModel = {

    };
    vm.validatorFields = [
        {
            "templateOptions": {
                "type": "text",
                "label": $translate.instant('VALIDATEFILEFORMAT'),
            },
            "defaultValue": true,
            "type": "checkbox",
            "key": "validate_file_format",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": $translate.instant('VALIDATEXMLFILE'),
            },
            "defaultValue": true,
            "type": "checkbox",
            "key": "validate_xml_file",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": $translate.instant('VALIDATELOGICALPHYSICALREPRESENTATION'),
            },
            "defaultValue": true,
            "type": "checkbox",
            "key": "validate_logical_physical_representation",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": $translate.instant('VALIDATEINTEGRITY'),
            },
            "defaultValue": true,
            "type": "checkbox",
            "key": "validate_integrity",
        }
    ];

    vm.sdModel = {};
    vm.sdFields = [
        {
            "templateOptions": {
                "type": "text",
                "label": "Start date",
                "disabled": true
            },
            "type": "input",
            "key": "start_date",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "End date",
                "disabled": true
            },
            "type": "input",
            "key": "end_date",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Archivist Organization",
                "disabled": true
            },
            "type": "input",
            "key": "archivist_organization",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Creator",
                "disabled": true
            },
            "type": "input",
            "key": "creator",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Submitter Organization",
                "disabled": true
            },
            "type": "input",
            "key": "submitter_organization",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Submitter Individual",
                "disabled": true
            },
            "type": "input",
            "key": "submitter_individual",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Producer Organization",
                "disabled": true
            },
            "type": "input",
            "key": "producer_organization",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Producer Individual",
                "disabled": true
            },
            "type": "input",
            "key": "producer_individual",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "IP owner",
                "disabled": true
            },
            "type": "input",
            "key": "ip_owner",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "Preservation Organization",
                "disabled": true
            },
            "type": "input",
            "key": "preservation_organization",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "System Name",
                "disabled": true
            },
            "type": "input",
            "key": "system_name",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "System Version",
                "disabled": true
            },
            "type": "input",
            "key": "system_version",
        },
        {
            "templateOptions": {
                "type": "text",
                "label": "System Type",
                "disabled": true
            },
            "type": "input",
            "key": "system_type",
        }
    ];
    $scope.buildSdForm = function(ip) {
        vm.sdModel = {
            "start_date": ip.start_date,
            "end_date": ip.end_date,
            "archivist_organization": ip.archivist_organization,
            "creator": ip.creator_organization,
            "submitter_organization": ip.submitter_organization,
            "submitter_individual": ip.submitter_individual,
            "producer_organization": ip.producer_organization,
            "producer_individual": ip.producer_individual,
            "ip_owner": ip.ipowner_organization,
            "preservation_organization": ip.preservation_organization,
            "system_name": ip.system_name,
            "system_version": ip.system_version,
            "system_type": ip.system_type
        };
    };
    $scope.getFileList = function(ip) {
        var array = [];
        var tempElement = {
            filename: ip.object_path,
            created: ip.create_date,
            size: ip.object_size
        };
        array.push(tempElement);
        $scope.fileListCollection = array;
    }
    //Remove and ip
    $scope.removeIp = function (ipObject) {
        $http({
            method: 'DELETE',
            url: appConfig.djangoUrl+"information-packages/"+ipObject.id
        }).then(function() {
            vm.displayedIps.splice(vm.displayedIps.indexOf(ipObject), 1);
            $scope.edit = false;
            $scope.select = false;
            $scope.eventlog = false;
            $scope.eventShow = false;
            $scope.statusShow = false;
            $rootScope.loadNavigation(ipSortString);
            $scope.getListViewData();
        });
    }
    $scope.editUnidentifiedIp = true;

    vm.modelUnidentifiedIp = {
        "archivist": "ESS",
        "creator": "Government X, Dep Y",
        "submitter_organization": "Government X, Archival Dep",
        "submitter_individual": "Gene Simmons",
        "producer_organization": "Government X system type",
        "producer_individual": "Government X, Service Dep",
        "ipowner": "Lita Ford",
        "preservation_organization": "Government X, Legal Dep",
        "systemname": "National Archives of X",
        "systemversion": "National Archives of X Version",
        "systemtype": "National Archives of X Type",
        "SUBMISSIONAGREEMENT": "RA 13-2011/5329; 2012-04-12",
        "STARTDATE": moment().format('YYYY-MM-DD'),
        "ENDDATE": moment().format('YYYY-MM-DD'),
        "LABEL": "Package label",
        "RECORDSTATUS": "NEW",
        "profile": "The profile"
    };

    vm.fieldsUnidentifiedIp = [
        //list all fields
        {
            "type": "input",
            "key": "archivist",
            "templateOptions": {
                "type": "text",
                "label": "Archivist Organization"
            }
        },
        {
            "type": "input",
            "key": "creator",
            "templateOptions": {
                "type": "text",
                "label": "Creator Organization"
            }
        },
        {
            "type": "input",
            "key": "submitter_organization",
            "templateOptions": {
                "type": "text",
                "label": "Submitter Organization"
            }
        },
        {
            "type": "input",
            "key": "submitter_individual",
            "templateOptions": {
                "type": "text",
                "label": "Submitter Individual"
            }
        },
        {
            "type": "input",
            "key": "producer_organization",
            "templateOptions": {
                "type": "text",
                "label": "Producer Organization"
            }
        },
        {
            "type": "input",
            "key": "producer_individual",
            "templateOptions": {
                "type": "text",
                "label": "Producer Individual"
            }
        },
        {
            "type": "input",
            "key": "ipowner",
            "templateOptions": {
                "type": "text",
                "label": "IP Owner Organization"
            }
        },
        {
            "type": "input",
            "key": "preservation_organization",
            "templateOptions": {
                "type": "text",
                "label": "Preservation Organization"
            }
        },
        {
            "type": "input",
            "key": "systemname",
            "templateOptions": {
                "type": "text",
                "label": "Archivist Software"
            }
        },
        {
            "type": "input",
            "key": "systemversion",
            "templateOptions": {
                "type": "text",
                "label": "Archivist Software Version"
            }
        },
        {
            "type": "input",
            "key": "systemtype",
            "templateOptions": {
                "type": "text",
                "label": "Archivist Software Type"
            }
        },
        {
            "type": "input",
            "key": "SUBMISSIONAGREEMENT",
            "templateOptions": {
                "type": "text",
                "label": "Submission Agreement"
            }
        },
        {
            "type": "datepicker",
            "key": "STARTDATE",
            "templateOptions": {
                "type": "text",
                "label": "Start date",
            }
        },
        {
            "type": "datepicker",
            "key": "ENDDATE",
            "templateOptions": {
                "type": "text",
                "label": "End date",
            }
        },
        {
            "type": "input",
            "key": "LABEL",
            "templateOptions": {
                "type": "text",
                "label": "Label"
            }
        },
        {
            "type": "input",
            "key": "RECORDSTATUS",
            "templateOptions": {
                "type": "text",
                "label": "Record Status"
            }
        },
        {
            "type": "input",
            "key": "profile",
            "templateOptions": {
                "type": "text",
                "label": "Profile"
            }
        },
    ];
    $scope.prepareUnidentifiedIp = false;
    $scope.showPrepareUnidentified = function(ip) {
        if(ip == $scope.ip) {
            $scope.prepareUnidentifiedIp = false;
        }else {
            $scope.ip = ip;
            $scope.prepareUnidentifiedIp = true;
            $scope.statusShow = false;
            $scope.eventShow = false;
        }
    }
    $scope.identifyIpModal = function (ip) {
        $scope.unidentifiedIp = ip;
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/identify_ip_modal.html',
            scope: $scope,
            size: 'lg',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        })
        modalInstance.result.then(function (data) {
            $scope.identifyIp($scope.unidentifiedIp);
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }

    $scope.identifyIp = function(ip) {
        $http({
            method: 'POST',
            url: appConfig.djangoUrl+'ip-reception/identify-ip/',
            data: {
                filename: ip.label,
                specification_data: vm.modelUnidentifiedIp
            }
        }).then(function(response) {
            $scope.prepareUnidentifiedIp = false;
            $timeout(function(){
                $scope.getListViewData();
                updateListViewConditional();
            }, 1000);
        });
    };
});
