'use strict';
angular.module('promises',['ngRoute','satellizer','trello-api-client'])

.config(function(TrelloClientProvider){
    TrelloClientProvider.init({
      key: 'c21f0af5b9c290981a03256a73f5c5fa',
      appName: 'Pipeline',
      tokenExpiration: 'never',
      scope: ['read', 'write', 'account'],
    });
  })

.controller('PromiseCtrl', function($scope,$http, $q, $timeout) {
   

$scope.trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";

//Split a pipe delimited string into a number of values
//assign those values to keys specified by a pipe deimited format string
//assign the key/value pairs to the object in the promise


function splitPipeObject(object,format,promiseToResolve){
    var myKeys = format.split("|");
    var myVals = object.split("|");
    var myObject={};
    for(var i=0;i<myKeys.length;i++){
        myObject[myKeys[i]]=myVals[i];
    }
    promiseToResolve.resolve(myObject);
}

//Generic Parsing function for Checklists from a card... 
//------------------------------------------------------
//takes card object and checklist to Check for (string) 
//along with a promise to resolve with the result.
//Builds an array of values and passes that array into the promise

function parseChecklist(card,checklistName,listItemFormat,promiseToResolve){
    var myChecklist = [];
    $http.get("https://trello.com/1/cards/"+card.id+"/checklists?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(response){
        for(var n=0;n<response.length;n++){
            if(response[n].name==checklistName){
                for(var i=0;i<response[n].checkItems.length;i++){
                    var myListObject={};
                    var listItemProperties = $q.defer();
                    listItemProperties.promise
                        .then(function(properties){
                            myListObject = properties;
                            myChecklist.push(myListObject);
                        })
                    splitPipeObject(response[n].checkItems[i].name,listItemFormat,listItemProperties);
                }
            }
        }
    })
    .then(function(checklist){
        promiseToResolve.resolve(myChecklist);
    })
}

//Generic Parsing function for a list of cards with checklists...

function parseChecklistsFromCardList(cardList,cardNameFormat,checklist,listName,listItemFormat,promiseToResolve){
    var myArrayOfObjects=[];
    var myObject = {};
    for(var m=0;m<cardList.length;m++){
        var objectProperties = $q.defer();
        objectProperties.promise
            .then(function(properties){
                //I should be able to do these two promises in one hit
                myObject=properties;
                myArrayOfObjects.push(myObject);
            })
        splitPipeObject(cardList[m].name,cardNameFormat,objectProperties);
        var objCard = $q.defer();
        objCard.promise
            .then(function(cardlist){
                myArrayOfObjects[m][listName] = cardlist;
            })
        parseChecklist(cardList[m],checklist,listItemFormat,objCard);
    }
    promiseToResolve.resolve(myArrayOfObjects);
}

$scope.trelloconfig={
    boardID:"QUYFKlKu",
    projectBoards:"55dc3f991aa96888e248b54a",
    teams:"55dc7476c84945317bb853b9"
};
$scope.boards=[];
$scope.teams=[];
$scope.trelloToken="waiting";
$scope.config="Waiting";
$scope.staff="Waiting";

var authorised = $q.defer();

//Get Config & Staff Data once authorised
authorised.promise
    .then(function (member){
        $scope.member = member;
        //Get Boards
        $http.get("https://trello.com/1/lists/"+$scope.trelloconfig.projectBoards+"/cards?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
            .success(function(response){
                var objBoardList=$q.defer();
                objBoardList.promise
                    .then(function(boards){
                        $scope.boards=boards;
                    })
                parseChecklistsFromCardList(response,"name|id","Lists","lists","name|id",objBoardList);
            })
            
    })
    .then(function(config){
        //Get Teams
        $http.get("https://trello.com/1/lists/"+$scope.trelloconfig.teams+"/cards?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
            .success(function(response){
                var objTeamList = $q.defer();
                objTeamList.promise
                    .then(function(teams){
                        $scope.teams=teams;
                    })
                parseChecklistsFromCardList(response,"name","Members","members","name",objTeamList);

        })
    })

$scope.trelloToken=localStorage.getItem('trello_token');
  $http.get("https://trello.com/1/tokens/"+$scope.trelloToken+"/member?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(member){
        authorised.resolve(member);
    });
    
});

