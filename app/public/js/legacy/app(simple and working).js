'use strict';

angular.module('pipeline', [])
  .controller('TrelloController', function($scope,$rootScope, $http){
    var pendingTask;


    if($scope.search === undefined){
      fetch();
    }
$scope.renderDayGrid($scope.today);

    function fetch(){
      //fetch cards from list
      $scope.projects=[];
      var trellokey = "YOUR TRELLO KEY";
      var trellotoken = "YOUR TRELLO TOKEN";
      $http.get("https://trello.com/1/lists/55916f3624405fba862eede7/cards?key="+trellokey+"&token="+trellotoken)
       .success(function parseRawList(response){
        $scope.rawList = response; 
        angular.forEach($scope.rawList,function pushProjectList(objCard){
          var description=splitDesc(objCard.desc);
          //push to projects array
          var cardid=objCard.id;
          var cardIDX = $scope.projects.push({
            projectName: objCard.name,
            id: objCard.id,
            trelloURL: objCard.shortUrl,
            startDate: description.startDate,
            deadline: objCard.due,
            notes: description.desc,
            assignments :[]
          });
          angular.forEach(objCard,function getChecklists(value,key){
            if(key=="idChecklists" && value.length >0){
              //iterate checklists on card
              for(var i=0;i<value.length;i++){
                $http.get("https://trello.com/1/checklists/"+value[i]+"?key="+trellokey+"&token="+trellotoken)
                .success(function parseChecklists(objCheckList){
                  angular.forEach(objCheckList, function extractTimeline(v,k){
                    if(k=="name" && v=="Project Timeline"){
                      var assignments = parseTimeLine(objCheckList.checkItems);
                      $scope.projects[cardIDX-1].assignments=assignments;
                    }
                  })
                })
              }
            }
          })
        })
      });


    console.log($scope);

    }

  });

function splitDesc(desc){
  var description = desc.split('|');
  var projectDetails={startDate:'',desc:''};
  if(description[0]!='start'){
    projectDetails.startDate = 'startdate';
    projectDetails.desc = description[1];
  }
  else
  {
    projectDetails.startDate = description[1];
    projectDetails.desc = description[2];
  }
  return projectDetails;
}

function parseTimeLine(timeline){
  var assignments = [];
  angular.forEach(timeline, function(value, key){
    angular.forEach(value, function(value,key){
      if(key=="name"){
      var assignment=value.split('|');
      var dates=assignment[1].split('-');
      assignments.push({
        resource: assignment[0],
        notes: assignment[2],
        startDate: dates[0],
        endDate: dates[1]
      });
    }
    })
  });
  return assignments;
}