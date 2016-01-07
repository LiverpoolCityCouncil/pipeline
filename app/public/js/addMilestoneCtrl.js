angular.module('pipeline').
  controller('addMilestoneCtrl',function ($scope, $rootScope, $http, $modal, $log, UIFunctions) {

    $scope.addMilestoneOpen = function (project,mousepos,weekgrid) {
    var modalInstance = $modal.open({
      templateUrl: 'addMilestoneModal.html',
      controller: 'addMilestoneModalInstanceCtrl',
      resolve: {
        project: function(){
          return project;
        },
        week: function () {
          return weekgrid;
        },
        mousepos: function(){
          return mousepos;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    }); 

  };
});

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('pipeline').controller('addMilestoneModalInstanceCtrl',function ($filter, $rootScope, $scope, lodash, $modalInstance, $http, project, week, mousepos, UIFunctions){
  $scope.weekGrid = week;
  $scope.project = project;
  $scope.mousepos = mousepos;

  var dayIndex = mousepos.col/60;
  var weekPos = Math.floor(dayIndex/5);
  var dayPos = dayIndex-(weekPos*5);
  $scope.selectedDate = $scope.weekGrid[weekPos].days[dayPos].ukDate;

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.sdopen = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.sdopened = true;
  };

  $scope.edopen = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.edopened = true;
  };

  $scope.format = 'dd/MM/yy';

  $scope.status = {
    opened: false
  };

  $scope.ok = function () {
    console.log($scope);
    var prj = lodash.find($rootScope.projects,{'id' : $scope.project.id});
    var md = $filter('date')(am_milestoneDate.value,'dd/MM/yyyy');
    var ms = new UIFunctions.Milestone(md,$scope.milestone.name);
    var shorthand = "MS|"+md+"|"+$scope.milestone.name;
    console.log(shorthand);
    prj.milestones.push(ms);
    UIFunctions.postAssignmentToTrello(prj,shorthand);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
    $modalInstance.dismiss('ok');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  }
});