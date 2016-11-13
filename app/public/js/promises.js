'use strict';
var pipeline = angular.module('pipeline', ['ngLodash', 'ngRoute', 'satellizer', 'trello-api-client']).config(function(TrelloClientProvider) {
    TrelloClientProvider.init({
        key: 'c21f0af5b9c290981a03256a73f5c5fa',
        appName: 'Pipeline',
        tokenExpiration: 'never',
        scope: ['read', 'write', 'account'],
    });
}).controller('PromiseCtrl', function($scope, $http, $q, $timeout, TrelloClient, UIFunctions, lodash) {
    $scope.status = 0;
    $scope.trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";
    //Split a pipe delimited string into a number of values
    //assign those values to keys specified by a pipe deimited format string
    //assign the key/value pairs to the object in the promise
    function splitPipeObject(string, format, promiseToResolve) {
        var myKeys = format.split("|");
        var myVals = string.split("|");
        var myObject = {};
        for (var i = 0; i < myKeys.length; i++) {
            myObject[myKeys[i]] = myVals[i];
        }
        if (promiseToResolve) {
            //function has been passed a 3rd parameter, so we resolve a promise
            promiseToResolve.resolve(myObject);
        } else {
            return myObject;
        }
    }
    //Generic Parsing function for Checklists from a card... 
    //------------------------------------------------------
    //takes card object and checklist to Check for (string) 
    //along with a promise to resolve with the result.
    //Builds an array of values and passes that array into the promise
    function parseChecklist(card, checklistName, listItemFormat, cardToExtend, listName, promiseToResolve) {
        var myChecklist = [];
        $http.get("https://trello.com/1/cards/" + card.id + "/checklists?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(response) {
            for (var n = 0; n < response.length; n++) {
                //Identify the checklist whose items we're after
                if (response[n].name == checklistName) {
                    //iterate the checklist's checkItems array
                    for (var i = 0; i < response[n].checkItems.length; i++) {
                        var myListObject = {};
                        if (response[n].checkItems[i].state == 'incomplete') {
                            myListObject = splitPipeObject(response[n].checkItems[i].name, listItemFormat);
                            myChecklist.push(myListObject);
                        }
                    }
                    //we've found the list we want, stop iterating.
                    break;
                }
            }
            //add the checklist to the card
            cardToExtend[listName] = myChecklist;
            cardToExtend.labels = card.labels;
            promiseToResolve.resolve(cardToExtend);
        })
    }
    //Generic Parsing function for a list of cards with checklists...
    //take a list of cards, (card names may be pipe separated)
    //push card details into an array, for each card
    function parseChecklistsFromCardList(cardList, cardNameFormat, checklist, listName, listItemFormat, promiseToResolve) {
        var myArrayOfCards = [];
        for (var m = 0; m < cardList.length; m++) {
            //split the name of the card into object properties by format
            //create the card with these properties
            var myCard = splitPipeObject(cardList[m].name, cardNameFormat);
            var objectProperties = $q.defer();
            objectProperties.promise.then(function(card) {
                myArrayOfCards.push(card);
                if (myArrayOfCards.length == cardList.length) {
                    promiseToResolve.resolve(myArrayOfCards);
                }
            })
            parseChecklist(cardList[m], checklist, listItemFormat, myCard, listName, objectProperties);
        }
    }
    $scope.trelloconfig = {
        boardID: "QUYFKlKu",
        projectBoards: "55dc3f991aa96888e248b54a",
        teams: "55dc7476c84945317bb853b9"
    };
    //TrelloClient.authenticate();
    //$scope.boards=[];
    //$scope.teams=[];
    $scope.appStatus = {
        authorised: false,
        teams: false,
        boards: false,
        staff:false,
        projects:false
    };
    $scope.trelloToken = "waiting";
    $scope.config = "Waiting";
    $scope.staff = "Waiting";
    var authorised = $q.defer();
    //Get Config & Staff Data once authorised
    authorised.promise.then(function(member) {
        $scope.member = member;
        //Get Boards
        $http.get("https://trello.com/1/lists/" + $scope.trelloconfig.projectBoards + "/cards?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(response) {
            var objBoardList = $q.defer();
            objBoardList.promise.then(function(boards) {
                $scope.boards = boards;
                //$scope.status=2;
            })
            parseChecklistsFromCardList(response, "name|id", "Lists", "lists", "name|id|show", objBoardList);
            //would be good to pass a "check for default" function in here too
        })
    }).then(function(config) {
        //Get Teams
        $http.get("https://trello.com/1/lists/" + $scope.trelloconfig.teams + "/cards?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(response) {
            var objTeamList = $q.defer();
            objTeamList.promise.then(function(teams) {
                $scope.teams = teams;
                //$scope.status=3;
            })
            parseChecklistsFromCardList(response, "name", "Members", "members", "name", objTeamList);
        })
    })
    $scope.$watch('boards', function(newValue, oldValue, scope) {
        if (Array.isArray(newValue) && !Array.isArray(oldValue)) {
            $scope.appStatus.boards = 'built';
        }
    }, true)
    $scope.$watch('teams', function(newValue, oldValue, scope) {
        if (Array.isArray(newValue) && !Array.isArray(oldValue)) {
            $scope.appStatus.teams = 'built';
        }
    })

    //Main Application Flow here - checks 'appStatus' variable for readiness to move on.
    
    $scope.$watch('appStatus', function(newValue, oldValue, scope) {
        console.log(newValue);
        if (newValue.boards == 'built' && newValue.teams == 'built' && !newValue.staff) {
            //we have both board & team objects, so we can proceed
            for (var board = 0; board < $scope.boards.length; board++) {
                $scope.boards[board].staff = [];
                console.log($scope.boards[board]);
                $http.get("https://trello.com/1/boards/" + $scope.boards[board].id + "/members?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(response) {
                    var staffCount = 0;
                    response.forEach(function(person) {
                        $http.get("https://trello.com/1/members/" + person.id + "/avatarhash?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(response) {
                            if (response._value) {
                                var avatarImg = "https://trello-avatars.s3.amazonaws.com/" + response._value + "/50.png";
                            } else {
                                var avatarImg = "/img/1x1transparent.png";
                            }
                            var userNameMatch = '@' + person.username;
                            //pattern matching from here: http://stackoverflow.com/questions/30107463/find-object-by-match-property-in-nested-array
                            var team = lodash.find($scope.teams,lodash.flow(
                                    lodash.property('members'),
                                    lodash.partialRight(lodash.some,{name:userNameMatch})
                                    )
                                );
                            var sm = new UIFunctions.StaffMember(person.fullName,person.id,userNameMatch,avatarImg,team.name);
                            $scope.boards[board - 1].staff.push(sm);//not sure about this "board-1" here... It seems to work, but not sure why
                        });
                        staffCount++;
                        if(staffCount == response.length){
                            $scope.appStatus.staff="built";
                        }

                    });
                });
            }
        }
        if(newValue.staff){
            console.log("we can build projects now");
        }
    }, true)
    $scope.trelloToken = localStorage.getItem('trello_token');
    $http.get("https://trello.com/1/tokens/" + $scope.trelloToken + "/member?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(member) {
        authorised.resolve(member);
        $scope.appStatus.authorised = true;
    });
});
