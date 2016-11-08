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


function splitPipeObject(string,format,promiseToResolve){
    var myKeys = format.split("|");
    var myVals = string.split("|");
    var myObject={};
    for(var i=0;i<myKeys.length;i++){
        myObject[myKeys[i]]=myVals[i];
    }
    if(promiseToResolve){
        //function has been passed a 3rd parameter, so we resolve a promise
            promiseToResolve.resolve(myObject);
    }
    else
    {
        return myObject;
    }
}

//Generic Parsing function for Checklists from a card... 
//------------------------------------------------------
//takes card object and checklist to Check for (string) 
//along with a promise to resolve with the result.
//Builds an array of values and passes that array into the promise

function parseChecklist(card,checklistName,listItemFormat,cardToExtend,listName,promiseToResolve){
    var myChecklist = [];
    $http.get("https://trello.com/1/cards/"+card.id+"/checklists?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(response){
        for(var n=0;n<response.length;n++){
            //console.log("iterating checklists")
            //Identify the checklist whose items we're after
            if(response[n].name==checklistName){
                //console.log("found the checklist we want ("+ checklistName +")")
                //iterate the checklist's checkItems array
                for(var i=0;i<response[n].checkItems.length;i++){
                    //console.log("iterating the checklist items")
                    var myListObject={};
                    //var listItemProperties = $q.defer();
                    //console.log("creating an object by splitting the name value at |");
                    myListObject=splitPipeObject(response[n].checkItems[i].name,listItemFormat);
                    //console.log(myListObject);
                    //console.log("pushing that object into an array")
                    myChecklist.push(myListObject);
                    //console.log(myChecklist);
                }
                break;  
            }
        }   
        cardToExtend[listName]=myChecklist;        
        promiseToResolve.resolve(cardToExtend);      
    })
    .then(function(myChecklist,listName,cardToExtend){
        
    })
}

//Generic Parsing function for a list of cards with checklists...
//take a list of cards, (card names may be pipe separated)
//push card details into an array, for each card

function parseChecklistsFromCardList(cardList,cardNameFormat,checklist,listName,listItemFormat,promiseToResolve){
    var myArrayOfCards=[];
    for(var m=0;m<cardList.length;m++){
        //split the name of the card into object properties by format
        //create the card with these properties
        var myCard = splitPipeObject(cardList[m].name,cardNameFormat);
        //Add the array of properties from the specified checklist to this object
        //then add this object to the array of cards
        var objectProperties = $q.defer();
        objectProperties.promise
            .then(function(card){
                myArrayOfCards.push(card);
            })
        parseChecklist(cardList[m],checklist,listItemFormat,myCard,listName,objectProperties);
    }
    promiseToResolve.resolve(myArrayOfCards);
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
                parseChecklistsFromCardList(response,"name|id","Lists","lists","name|id|show",objBoardList);
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

