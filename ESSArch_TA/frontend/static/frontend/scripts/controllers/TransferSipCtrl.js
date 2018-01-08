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

angular.module('myApp').controller('TransferSipCtrl', function(IP, $http, $scope, $rootScope, $state, $log, listViewService, Resource, $translate, $interval, $uibModal, appConfig, $timeout, $anchorScroll, PermPermissionStore, $cookies, $controller, TopAlert) {
    var vm = this;
    var ipSortString = "Received,Transformed,Transferring,Transferred";
    $controller('BaseCtrl', { $scope: $scope, vm: vm, ipSortString: ipSortString });

    $scope.ipTableClick = function(row) {
        if($scope.select && $scope.ip.id== row.id){
            $scope.select = false;
            $scope.ip = null;
            $rootScope.ip = null;
            $scope.filebrowser = false;
        } else {
            $scope.ip = row;
            $rootScope.ip = row;
            $scope.select = true;
            $scope.transferDisabled = false;
        }
        $scope.eventShow = false;
        $scope.statusShow = false;
    };


    $scope.transferDisabled = false;
    $scope.transferSip = function(ip) {
        $scope.transferDisabled = true;
        IP.transfer({
            id: ip.id
        }).$promise.then(function(response) {
            $scope.select = false;
            $timeout(function() {
                $scope.getListViewData();
                vm.updateListViewConditional();
            }, 1000);
            $scope.transferDisabled = false;
        }).catch(function(response) {
            $scope.transferDisabled = false;
            TopAlert.add(response.data.detail, "error");
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
    vm.transferModal = function (ips) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/transfer_sip_modal.html',
            scope: $scope,
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl'
        })
        modalInstance.result.then(function (data) {
            $scope.transferSip(data.ip);
        }, function () {
            $log.info('modal-component dismissed at: ' + new Date());
        });
    }
});
