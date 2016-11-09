'use strict';
var pipeline=angular.module('pipeline',['ngRoute','satellizer','trello-api-client'])

.config(function(TrelloClientProvider){
    TrelloClientProvider.init({
      key: 'c21f0af5b9c290981a03256a73f5c5fa',
      appName: 'Pipeline',
      tokenExpiration: 'never',
      scope: ['read', 'write', 'account'],
    });
  })

.controller('PromiseCtrl', function($scope,$http, $q, $timeout,TrelloClient,UIFunctions) {
   

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
            //Identify the checklist whose items we're after
            if(response[n].name==checklistName){
                //iterate the checklist's checkItems array
                for(var i=0;i<response[n].checkItems.length;i++){
                    var myListObject={};
                    if(response[n].checkItems[i].state=='incomplete'){
                        myListObject=splitPipeObject(response[n].checkItems[i].name,listItemFormat);
                        myChecklist.push(myListObject);
                    }
                }
                //we've found the list we want, stop iterating.
                break;  
            }
        }  
        //add the checklist to the card
        cardToExtend[listName]=myChecklist;        
        promiseToResolve.resolve(cardToExtend);      
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
//TrelloClient.authenticate();
$scope.boards=[];
$scope.teams=[];
$scope.projects=[];
$scope.trelloToken="waiting";
$scope.config="Waiting";
$scope.staff="Waiting";

var authorised = $q.defer();

//Get Config & Staff Data once authorised
authorised.promise
    .then(function(member){
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
    .then(function(){
        //Build board Object
        // - Q: Do I actually need a separate staff object? - would it not be quicker to just add assignments to the existing staff in the Teams object
        // - A: YES! we do. We build a staff object for each board, because not all staff may have access to all boards.
        // - Maybe it would be better to add staff & projects arrays to $scope.boards, allowing us to build the array asynchronously 
        // (starting with the default board)

        
        
    })

$scope.trelloToken=localStorage.getItem('trello_token');
  $http.get("https://trello.com/1/tokens/"+$scope.trelloToken+"/member?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(member){
        authorised.resolve(member);
    });
    
});

