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

function parseChecklist(card,checklistName,listItemFormat,cardToExtend,promiseToResolve){
    var myChecklist = [];
    $http.get("https://trello.com/1/cards/"+card.id+"/checklists?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(response){
        for(var n=0;n<response.length;n++){
            //Identify the checklist whose items we're after
            if(response[n].name==checklistName){
                //iterate the checklist's checkItems array
                for(var i=0;i<response[n].checkItems.length;i++){
                    var myListObject={};
                    //var listItemProperties = $q.defer();
                    myChecklist.push(splitPipeObject(response[n].checkItems[i].name,listItemFormat));
                    console.log(myChecklist);
/*
                    //create a promise: when we have all the 
                    listItemProperties.promise
                        .then(function(properties){
                            myListObject = properties;
                            myChecklist.push(myListObject);
                            return myChecklist;
                        })
                    splitPipeObject(
                    //We're looking here at a checklist Item - we want to push the item into an array of items
                    response[n].checkItems[i].name, // the checkItem's name
                    listItemFormat,                 // the format (passed in from the calling function)
                    listItemProperties             // the promise we want to resolve
                    ); 
                    return myChecklist;
*/
                }
            }
        }
        return myChecklist;
        
    })
    .then(function(myChecklist){
        promiseToResolve.resolve(cardToExtend,myChecklist);
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
            .then(function(cardToExtend,properties){
                angular.extend(cardToExtend,properties);
                myArrayOfCards.push(cardToExtend);
            })
        parseChecklist(cardList[m],checklist,listItemFormat,myCard,objectProperties);
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
    /*.then(function(config){
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
    })*/

$scope.trelloToken=localStorage.getItem('trello_token');
  $http.get("https://trello.com/1/tokens/"+$scope.trelloToken+"/member?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success(function(member){
        authorised.resolve(member);
    });
    
});

