angular.module('pipeline').
  controller('assignStaffCtrl',function ($scope, $rootScope, $http, $modal, $log, UIFunctions) {
    $scope.assignStaffOpen = function (project) {
    var modalInstance = $modal.open({
      templateUrl: 'assignStaffModal.html',
      controller: 'assignStaffModalInstanceCtrl',
      resolve: {
        staffMemberList: function(){
          return $rootScope.staff
        },
        project: function () {
          return $scope.project;
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

angular.module('pipeline').controller('assignStaffModalInstanceCtrl',function ($filter, $rootScope, $scope, lodash, $modalInstance, $http, staffMemberList, project, UIFunctions){
  $scope.project = project;
  $scope.staffMemberList = staffMemberList;
  //console.log(assignStaff);
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
    var sm = lodash.find($rootScope.staff,{'id' : $scope.assignStaff.staffMember.id});
    console.log (sm);
    var sd = $filter('date')($scope.assignStaff.startDate,'dd/MM/yyyy');
    var ed = $filter('date')($scope.assignStaff.endDate,'dd/MM/yyyy');
    var thisAssignment = new UIFunctions.Assignment($scope.assignStaff.prj,prj.projectName,sm.userName,sd,ed,$scope.assignStaff.notes,$scope.assignStaff.hours);
    var shorthand = sm.userName+'|'+sd+'-'+ed+'|'+$scope.assignStaff.notes+'|'+$scope.assignStaff.hours;
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