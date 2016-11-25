angular.module('myApp').controller('EventCtrl', ['Resource', '$scope', '$rootScope', 'listViewService','$interval','appConfig', function (service, $scope, $rootScope, listViewService, $interval, appConfig) {
    $scope.selected = [];
    $scope.displayed = [];
    $rootScope.$on('$stateChangeStart', function() {
        $interval.cancel(eventInterval);
    });
    $scope.getEventOutcome = function(outcome) {
        if(outcome == 0) {
            return "Success";
        } else {
            return "Failure";
        }
    }
    $scope.eventOutcomes = [
    {
        name: "Success",
        value: 0
    },
    {
        name: "Failure",
        value: 1
    }

    ]
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
        listViewService.addEvent(ip, eventType, eventDetail, eventOutcome).then(function(value) {
            $rootScope.stCtrl.pipe();
        });
    }
    var eventInterval;
    function updateEvents() {
        $interval.cancel(eventInterval);
        eventInterval = $interval(function() {
            $rootScope.stCtrl.pipe();
        }, appConfig.eventInterval);
    }
    updateEvents();
    //Get data from rest api for event table
    $scope.eventPipe = function(tableState, ctrl) {
        $rootScope.stCtrl = ctrl;
        var sorting = tableState.sort;
        var pagination = tableState.pagination;
        var start = pagination.start || 0;     // This is NOT the page number, but the index of item in the list that you want to use to display the table.
        var number = pagination.number || 10;  // Number of entries showed per page.
        var pageNumber = start/number+1;

        service.getEventPage(start, number, pageNumber, tableState, $scope.selected, sorting).then(function (result) {
            $scope.displayed = result.data;
            tableState.pagination.numberOfPages = result.numberOfPages;//set the number of pages so the pagination can update
            $scope.tableState = tableState;
        });
    };

}]);
