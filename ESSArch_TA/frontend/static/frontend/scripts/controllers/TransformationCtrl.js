angular.module('myApp').controller('TransformationCtrl', function($scope, $controller, Resource, listViewService, TopAlert, $http, $sce, $rootScope, $cookies, $timeout, appConfig, $uibModal, $window, Profile, $q, IP, $interval) {
    var vm = this;
    var ipSortString ="";
    $controller('WorkareaCtrl', { $scope: $scope, vm: vm, ipSortString: ipSortString });
    var watchers=[];
    $scope.$on('$stateChangeStart', function () {
        $interval.cancel(validatorInterval);
        watchers.forEach(function(watcher) {
            watcher();
        });
    });

    $scope.$on('REFRESH_LIST_VIEW', function (event, data) {
        if($scope.ip != null && $scope.select) {
            vm.validatorListPipe(vm.validatorTableState);
        }
    });

    $scope.ipTableClick = function(row) {
        if($scope.select && $scope.ip.id== row.id){
            $scope.select = false;
            $scope.ip = null;
            $rootScope.ip = null;
            $scope.filebrowser = false;
        } else {
            $scope.ip = row;
            $rootScope.ip = row;
            vm.validatorListPipe(vm.validatorTableState);
            $scope.select = true;
        }
        $scope.eventShow = false;
        $scope.statusShow = false;
    };

    var validatorInterval = $interval(function() {
        if($scope.ip && $scope.select) {
            vm.validatorListPipe(vm.validatorTableState);
        }
    }, appConfig.ipInterval);

    vm.validatorListPipe = function (tableState) {
        vm.validatorTableState = tableState;
        $scope.validatorsLoading = true;
        IP.get({ id: $scope.ip.id }).$promise.then(function (resource) {
            $scope.ip = resource;
            $rootScope.ip = resource;
            if ($scope.ip.profile_validation) {
                Profile.get({ id: $scope.ip.profile_validation.profile }).$promise.then(function (resource) {
                    vm.buildValidatorTable(resource.specification, $scope.ip);
                    var validationComplete = true;
                    if (resource.specification._required) {
                        resource.specification._required.forEach(function (value) {
                            if ($scope.ip.workarea.successfully_validated[value] == false || $scope.ip.workarea.successfully_validated[value] == null || angular.isUndefined($scope.ip.workarea.successfully_validated[value])) {
                                validationComplete = false;
                            }
                        });
                    }
                    $scope.validatorsLoading = false;
                    vm.validation_complete = validationComplete;
                });
            } else {
                vm.validators = [];
                $scope.validatorsLoading = false;
            }

            if (!$scope.ip.profile_transformation) {
                TopAlert.add("IP " + $scope.ip.label + " has no transformation profile!", "info");
            }
        });
    }

    vm.buildValidatorTable = function(specification, row) {
        var promises = [];
        angular.forEach(specification, function (value, key, object) {
            if (key.startsWith('_')) return;
            var val = {
                name: key,
                passed: true
            }
            if(object._required && object._required.includes(key)) {
                val.required = true;
            }
            promises.push($http.head(appConfig.djangoUrl + "information-packages/" + row.id + "/validations/",
                {
                    params: {
                        validator: key,
                        passed: false,
                    }
                }).then(function (response) {
                    val.failed_count = response.headers('Count');
                    return val;
                }));
        })
        $q.all(promises).then(function (validators) {
            vm.validators = validators;
        });
    }

    vm.transform = function(ip) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'static/frontend/views/transform_modal.html',
            controller: 'DataModalInstanceCtrl',
            controllerAs: '$ctrl',
            resolve: {
                data: {
                    ip: ip
                }
            }
        })
        modalInstance.result.then(function (data) {
            $scope.select = false;
            $scope.ip = null;
            $rootScope.ip = null;
            $scope.getListViewData();
        });
    }
});