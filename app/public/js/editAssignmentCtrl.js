angular.module('pipeline').
  controller('editAssignmentCtrl',function ($scope, $rootScope, $http, $modal, $log, UIFunctions, lodash) {

    $scope.editAssignmentOpen = function(thisProject,thisAssignment) {
    var modalInstance = $modal.open({
      templateUrl: 'editAssignmentModal.html',
      controller: 'editAssignmentModalInstanceCtrl',
      resolve: {
        staffMemberList: function(){
          return $rootScope.staff
        },
        assignment: function () {
          //console.log(thisAssignment);
          var assignment = lodash.find(thisProject.assignments,{'assignmentID' : thisAssignment});
          //console.log(assignment);
          return assignment;
        },
        project: function(){
          return thisProject;
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

angular.module('pipeline').controller('editAssignmentModalInstanceCtrl',function ($filter, $rootScope, $scope, lodash, $modalInstance, $http, staffMemberList, assignment, project, UIFunctions){
  $scope.editAssignment = assignment;
  $scope.project = project;
  $scope.staffMemberList = staffMemberList;
  var initialSM = lodash.find($rootScope.staff,{'userName' : assignment.resource});
  $scope.editAssignment.staffMember = initialSM;
  $scope.editAssignment.notes = assignment.notes;

  // Disable weekend selection in datePicker (this doesn't work)
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
  var reassigned = false;

  $scope.reassign = function(){
    reassigned=true;
    console.log("Reassigned!");
      console.log('selected staffmember == '+ $scope.editAssignment.staffMember.userName);
      console.log('previous staffmember: '+ initialSM.userName);
  }

  $scope.ok = function () {
    var prj = lodash.find($rootScope.projects,{'id' : $scope.project.id});
    var ass = lodash.find(prj.assignments,{'assignmentID' : $scope.editAssignment.assignmentID});
    //update details in existing assignment
    var sd = $filter('date')($scope.editAssignment.startDate,'dd/MM/yyyy');
    var ed = $filter('date')($scope.editAssignment.endDate,'dd/MM/yyyy');
    ass.startDate=sd;
    ass.endDate=ed;
    ass.resource=$scope.editAssignment.staffMember.userName;
    ass.hours=$scope.editAssignment.hours;
    ass.notes=$scope.editAssignment.notes;

    if(reassigned){
      //we've selected a new staffMember - so we need to remove the assignment from the old staffmember
      $scope.editAssignment.staffMember.assignments.push(ass);
      var i = initialSM.assignments.indexOf(ass);
      if(i != -1){
        initialSM.assignments.splice(i,1);
      }
    }
    
    var shorthand = $scope.editAssignment.staffMember.userName+'|'+sd+'-'+ed+'|'+$scope.editAssignment.notes+'|'+$scope.editAssignment.hours;
    UIFunctions.updateAssignmentInTrello(prj,ass,shorthand)
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
    $modalInstance.dismiss('ok');

  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  }
});