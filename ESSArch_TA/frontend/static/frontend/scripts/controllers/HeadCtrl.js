angular
  .module('essarch.controllers')
  .controller('HeadCtrl', function($scope, $rootScope, $timeout, $translate, $state) {
    var vm = this;
    var appName = ' | ESSArch Tools for Archive';
    vm.pageTitle = 'ESSArch Tools for Archive';
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      vm.pageTitle =
        $translate.instant(
          toState.name
            .split('.')
            .pop()
            .toUpperCase()
        ) + appName;
    });
    $scope.$on('$translateChangeSuccess', function() {
      vm.pageTitle =
        $translate.instant(
          $state.current.name
            .split('.')
            .pop()
            .toUpperCase()
        ) + appName;
    });
  });
