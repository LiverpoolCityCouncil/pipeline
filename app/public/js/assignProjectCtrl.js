angular.module('pipeline').
  controller('assignProjectCtrl',function ($scope, $rootScope, $http, $modal, $log, UIFunctions) {

    $scope.assignProjectOpen = function (staffMember) {
    //renderProjectList();
    //UIFunctions.testme();
    var modalInstance = $modal.open({
      templateUrl: 'assignProjectModal.html',
      controller: 'assignProjectModalInstanceCtrl',
      resolve: {
        projectList: function(){
          return $rootScope.projects
        },
        staffMember: function () {
          return $scope.staffMember;
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

angular.module('pipeline').controller('assignProjectModalInstanceCtrl',function ($filter, $rootScope, $scope, lodash, $modalInstance, $http, projectList, staffMember, UIFunctions){
  $scope.staffMember = staffMember;
  $scope.projectList = projectList;

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

    if(!$scope.staffMember.assignments){
      $scope.staffMember.assignments=[];
    }
  //console.log($scope.assignProject);
    var prj = lodash.find($rootScope.projects,{'id' : $scope.assignProject.prj});
    var sm = lodash.find($rootScope.staff,{'id' : staffMember.id});
    var sd = $filter('date')($scope.assignProject.startDate,'dd/MM/yyyy');
    var ed = $filter('date')($scope.assignProject.endDate,'dd/MM/yyyy');
    var thisAssignment = new UIFunctions.Assignment($scope.assignProject.prj,prj.projectName,sm.userName,sd,ed,$scope.assignProject.notes,$scope.assignProject.hours);
    var shorthand = sm.userName+'|'+sd+'-'+ed+'|'+$scope.assignProject.notes+'|'+$scope.assignProject.hours;
    console.log(shorthand);
    prj.assignments.push(thisAssignment);
    sm.assignments.push(thisAssignment);
    console.log(thisAssignment);
    UIFunctions.postAssignmentToTrello(prj,shorthand);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
    $modalInstance.dismiss('ok');

  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  }
});