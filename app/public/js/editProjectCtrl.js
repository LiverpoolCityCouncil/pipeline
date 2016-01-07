angular.module('pipeline').
  controller('editProjectCtrl',function ($scope, $rootScope, $http, $modal, $log, UIFunctions) {

    $scope.editProjectOpen = function(thisProject){

      if(thisProject.trelloBoard){
      if(thisProject.trelloBoard.substr(0,20)!="https://trello.com/b/"){
        thisProject.trelloBoard = "https://trello.com/b/" +thisProject.trelloBoard;
      }
    }

      console.log(thisProject);
      var modalInstance = $modal.open({
        templateUrl: 'editProjectModal.html',
        controller: 'editProjectModalInstanceCtrl',
        resolve: {
          pmList: function(){
            return $rootScope.staff;
          },
          project: function(){
            return thisProject;
          },
          colours: function(){
            return $rootScope.colours;
          }
        }
      })
    }

});

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

angular.module('pipeline').controller('editProjectModalInstanceCtrl',function ($filter, $rootScope, $scope, lodash, $modalInstance, $http, project, colours, pmList, UIFunctions){
$scope.project = project;
console.log($scope.project);
$scope.pmList = pmList;
$scope.colours = colours;
$scope.project.pm = lodash.find($rootScope.staff,{userName:project.pm});
$scope.project.colour = lodash.find($rootScope.colours,{name:project.colour});
$scope.project.colour

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

    console.log($scope.project);
    var prj = lodash.find($rootScope.projects,{'id' : $scope.project.id});
    if($scope.project.pm){
    prj.pm = $scope.project.pm.userName;
    }
    prj.colour = $scope.project.colour.name;
    prj.startDate = $filter('date')($scope.project.startDate,"dd/MM/yyyy");
    prj.deadline = $scope.project.deadline;
    prj.spiderRef = $scope.project.spiderRef;
    prj.projName = $scope.project.projectName;
    prj.newToPipeline = false;
    var tb=["","","",""];
    if(prj.trelloBoard){
      tb = prj.trelloBoard.split("/");
      console.log(tb);
      }
    prj.trelloBoard = tb[4];
    //replace the "PIPELINE{} element in the notes field with the new version"
    var pipelineUpdateJSON = "PIPELINE{pm:"+prj.pm+",colour:"+prj.colour+",startDate:"+prj.startDate+",spiderRef:"+prj.spiderRef+",trelloBoard:"+tb[4]+"}";
    prj.notes = pipelineUpdateJSON + String.fromCharCode(10) + $scope.project.notes.replace($scope.project.notes.match(/(?:PIPELINE){(.*?)}/g),'');
    console.log(prj);
    UIFunctions.updateTrelloProject(prj);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
    $modalInstance.dismiss('ok');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  }

});