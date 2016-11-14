'use strict';
var pipeline = angular.module('pipeline', ['ngLodash','ui.bootstrap','ngCookies','ngRoute','satellizer','trello-api-client']).config(function(TrelloClientProvider) {
    TrelloClientProvider.init({
        key: 'c21f0af5b9c290981a03256a73f5c5fa',
        appName: 'Pipeline',
        tokenExpiration: 'never',
        scope: ['read', 'write', 'account'],
    });
}).controller('TrelloController', function($scope,$rootScope, $q, lodash, $window,$route, $cookieStore, $http, UIFunctions,TrelloClient) {
   

    $scope.trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";

/*

 #####    ##   #####   ##
 #    #  #  #    #    #  #
 #    # #    #   #   #    #
 #    # ######   #   ######
 #    # #    #   #   #    #
 #####  #    #   #   #    #

*/

$scope.showItemsFromThisList = function(listID){
  for(var n = 0;n < $scope.boards[0].lists.length;n++){
    if($scope.boards[0].lists[n].id == listID && $scope.boards[0].lists[n].show == true){
      return true;
    }
  }
  return false;
}

$scope.showMembersFromThisTeam = function(team){
  for(var n = 0;n < $scope.teams.length;n++){
    if($scope.teams[n].name == team && $scope.teams[n].show == true){
      return true;
    }
  }
  return false;
}

var getCards =function getCards(arrList){
//get cards
  for(var n = 0;n < arrList.length;n++){
      $http.get("https://trello.com/1/lists/"+arrList[n].id+"/cards?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
  .success(buildProjectsObject);
  }
}

var buildProjectsObject = function(response){
    parseCards(response,UIFunctions.parseStaffAssignments);
}

/*

 #    # ##### # #      # ##### # ######  ####
 #    #   #   # #      #   #   # #      #
 #    #   #   # #      #   #   # #####   ####
 #    #   #   # #      #   #   # #           #
 #    #   #   # #      #   #   # #      #    #
  ####    #   # ###### #   #   # ######  ####

*/

function dateOrdinal(inDate){
  var doParts = inDate.split("/");
  var dop = doParts[2]+doParts[1]+doParts[0];
  return dop;
}

Date.prototype.getWeek = function() {
  var onejan = new Date(this.getFullYear(),0,1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}
Date.prototype.addDays = function(daysToAdd){
  var result = new Date(this.getTime() + (daysToAdd * 24 * 60 * 60 *1000));
  return result;
}
Date.prototype.subtractDays = function(daysToSubtract){
  var result = new Date(this.getTime() - (daysToSubtract * 24 * 60 * 60 *1000));
  return result;
}

function assignToStaff(assignment){
  var resource = assignment.resource.split('@');
  $rootScope.staff.forEach(function(person){
    if(person.userName == '@'+resource[1]){
      person.assignments.push(assignment);
      UIFunctions.renderStaffBar(assignment,'',person.capacity);
    }
  });
}

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
function workingDaysBetweenDates(startDate, endDate) {

    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0,0,0,1);  // Start just after midnight
    endDate.setHours(23,59,59,999);  // End just before midnight
    var diff = endDate - startDate;  // Milliseconds between datetime objects
    var days = Math.ceil(diff / millisecondsPerDay);

    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    var days = days - (weeks * 2);

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();

    // Remove weekend not previously removed.
    if (startDay - endDay > 1)
        days = days - 2;

    // Remove start day if span starts on Sunday but ends before Saturday
    if (startDay == 0 && endDay != 6)
        days = days - 1

    // Remove end day if span ends on Saturday but starts after Sunday
    if (endDay == 6 && startDay != 0)
        days = days - 1

    return days;
}

  function splitDesc(desc){
    //REGEXP Match PIPELINE{k:v,K:v...}
    var PLCTRL = desc.match(/(?:PIPELINE){(.*?)}/g);
    if(PLCTRL!=null){
      var PLCTRL = PLCTRL[0].replace('PIPELINE','');
      var fixedJSON = PLCTRL.replace(/(['"])?([a-zA-Z0-9_@\-\\\/]+)(['"])?/g, '"$2"');
      var objPLCTRL = JSON.parse(fixedJSON);
    }
    return objPLCTRL;
  }

  function removeSpiderRefs(projectName){
    var strippedName = projectName.replace(/(BRC)\w+|(brc)\w+|(DIG)\w+/g,'');
    var strippedName = strippedName.replace(/^[^a-zA-Z*]*/g,'');
    return strippedName;

  }

  /*

  ####  #####  # #####     #    # #
 #    # #    # # #    #    #    # #
 #      #    # # #    #    #    # #
 #  ### #####  # #    #    #    # #
 #    # #   #  # #    #    #    # #
  ####  #    # # #####      ####  #



*/

  $scope.renderDayGrid=function(startDate){
    //what day is today?
    var today = new Date();

    $rootScope.dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    $rootScope.monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    if(startDate.getDay() < 6){
      startDate
    }

    /*
    Bug happens after we've subtracted 7 days from rootScope.startDate.
    It renders the first week fine, but then seems to add a day before
    rendering the second week
    */

    var dayCount =0;
    //if it's Sat(6) or Sun (0) move to next week
    //move startdate to Monday
    if(startDate.getDay() == 0){
      startDate=startDate.addDays(1);
    }
    else if(startDate.getDay()==6){
      startDate = startDate.addDays(2);
    }
    else{
      startDate = startDate.subtractDays(startDate.getDay()-1);
    }
    startDate.setHours(0,0,0,1);

    $rootScope.startDate = startDate;//wowser - that's a hard set right there...

    //we want the next 30 working days (Mon-Fri)

    $scope.weekGrid=[];

    for(var w=0;w<6;w++){
      var weekIdx = startDate.getWeek();
      var weekDays=[];
      for(var d=0;d<5;d++){
        var thisDay = startDate.addDays(dayCount);
        var activeClass="";
        if (thisDay.getDate()==today.getDate() && thisDay.getMonth() == today.getMonth()){
          activeClass="today";
        }
        else
        {
          activeClass="";
        }
        weekDays.push({
          date:thisDay.getDate(),
          today:activeClass,
          month:$rootScope.monthNames[thisDay.getMonth()],
          ukDate:thisDay.getDate()+"/"+(thisDay.getMonth()+1)+"/"+thisDay.getFullYear(),
          year:thisDay.getFullYear(),
          day:$rootScope.dayNames[thisDay.getDay()]
          });
        dayCount++;
      }
      //add weekends
      dayCount+=2;
      if(thisDay.getWeek()==today.getWeek()){
        activeClass = "this-week";
      }
      else{
        activeClass="";
      }
      $scope.weekGrid.push(
        {
        week:weekIdx+w,
        active:activeClass,
        range:weekDays[0].date + ' - ' +weekDays[4].date + ' ' +weekDays[4].month,
        days:weekDays
        }
      );
    }
  }


/*

 #      #  ####  ##### ###### #    # ###### #####   ####
 #      # #        #   #      ##   # #      #    # #
 #      #  ####    #   #####  # #  # #####  #    #  ####
 #      #      #   #   #      #  # # #      #####       #
 #      # #    #   #   #      #   ## #      #   #  #    #
 ###### #  ####    #   ###### #    # ###### #    #  ####

*/

  $scope.backDate = function(){
    $scope.offset -= 5;
    $rootScope.startDate=$rootScope.startDate.subtractDays(7);
    //$scope.today = $rootScope.startDate;
    $scope.renderDayGrid($rootScope.startDate);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
  }

  $scope.fwdDate = function(){
    $scope.offset += 5;
    $rootScope.startDate=$rootScope.startDate.addDays(7);
    //$scope.today = $rootScope.startDate;
    $scope.renderDayGrid($rootScope.startDate);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
  }

  $scope.thisWeek = function(){
    $scope.offset = 0;
    $rootScope.startDate=$rootScope.today;
    //$scope.today = $rootScope.startDate;
    $scope.renderDayGrid($rootScope.startDate);
    UIFunctions.parsePrjAssignments(UIFunctions.parseStaffAssignments());
  }

  $scope.expandAll = function(){
    $rootScope.projects.forEach(function(project){
      project.showAssignments = true;
    });
    $rootScope.staff.forEach(function(staffMember){
      staffMember.showAssignments = true;
    });
    $scope.allExpanded = false;
  }

    $scope.collapseAll = function(){
    $rootScope.projects.forEach(function(project){
      project.showAssignments = false;
    });
    $rootScope.staff.forEach(function(staffMember){
      staffMember.showAssignments = false;
    })
    $scope.allExpanded = true;
  }

  $scope.leftPosFromStart = function(start){
    var startDate = UIFunctions.parseDMY(start);
    var lp = UIFunctions.workingDaysBetweenDates($rootScope.startDate, startDate);
    return ((lp-1)*60);
  }

  $scope.echomouse = function(index){
    $scope.mousepos={row:index,col:(Math.ceil(event.clientX/60)*60)-360};
  }

 $scope.changeProjectList= function(trelloList){
    trelloList.show != trelloList.show;
    $cookieStore.put('showBoards',btoa(JSON.stringify($scope.trelloLists)));
    var cookieValue=(JSON.parse(atob($cookieStore.get('showBoards'))));
    console.log(cookieValue);
  };

  $scope.changeTeamList= function(team){
    team.show != team.show;
    $cookieStore.put('showTeams',btoa(JSON.stringify($scope.teams)));
    var cookieValue=(JSON.parse(atob($cookieStore.get('showTeams'))));
    console.log(cookieValue);
  };

  $scope.login = function(){
  $scope.splash = false;
  TrelloClient.authenticate();
}

$scope.firstRun = function(){
  $scope.startscreen=false;
  $scope.trelloToken=localStorage.getItem('trello_token');
  $http.get("https://trello.com/1/tokens/"+$scope.trelloToken+"/member?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
    .success($scope.go);
}

$scope.signout = function(){
  localStorage.removeItem('trello_token');
  $scope.splash = true;
  $scope.startscreen=true;
  $scope.acctDropdown=false;
  $window.location.reload();
}

/*

 #####    ##   #####   ####  ###### #####   ####
 #    #  #  #  #    # #      #      #    # #
 #    # #    # #    #  ####  #####  #    #  ####
 #####  ###### #####       # #      #####       #
 #      #    # #   #  #    # #      #   #  #    #
 #      #    # #    #  ####  ###### #    #  ####

*/

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

function parseProjectTimeline(tl,projectName,prjStartDate){
  //work out the calculated start date and end date here.
  var timeline = {assignments:[],milestones:[]};
  var csd=0, asd=0;
  var ced=0, aed=0;
  for(var n=0;n<tl.checkItems.length;n++){
    //don't bother with ticked off items
    if(tl.checkItems[n].state == 'incomplete'){
      if(tl.checkItems[n].name.substring(0,2)!="MS"){
        var assignment=tl.checkItems[n].name.split('|');
        var hours = 7;
        if(assignment[3]){
          hours=assignment[3];
        }
        var staffMember = assignment[0].replace(' ','');//remove spaces from hand-cranked assignments!
        //check for date styles...
        //------------------------
        //Assignments can either have manual date ranges in the form dd/MM/yyyy-dd/MM/yyyy
        //or can be based upon the start date in the format: +n:d where n=days after start date and d=duration (in working days)
        //
        ////console.log(typeof assignment[1]);
        if(assignment[1].substr(0,1) == "+"){
          var extractDateParts = assignment[1].substr(1,assignment[1].length);
          var dateCalcParts = assignment[1].split(":");
          var startDateNumberPart = dateCalcParts[0].substr(1,dateCalcParts[0].length);
          var sdnpAsInt=parseInt(startDateNumberPart);
          var atsd = sdnpAsInt;
          asd = UIFunctions.addWorkingDaysToDate(prjStartDate,atsd);
          aed = UIFunctions.addWorkingDaysToDate(asd,parseInt(dateCalcParts[1]));
          //console.log(assignment[2]+" :"+asd+" -> "+aed);
        }
        else
        {
          var dates=assignment[1].split('-');
          asd = dates[0];
          aed = dates[1];
        }
        if(csd==0||dateOrdinal(asd)<dateOrdinal(csd)){
          csd = asd;
        }
        if(ced==0||dateOrdinal(aed)>dateOrdinal(ced)){
          ced = aed;
        }
        var thisAssignment = new UIFunctions.Assignment(timeline.id,projectName,staffMember,asd,aed,assignment[2],hours);
        thisAssignment.assignmentID=tl.checkItems[n].id;
        timeline.assignments.push(thisAssignment);
      }
      else if(tl.checkItems[n].name.substring(0,2)=="MS"){
        var milestone = tl.checkItems[n].name.split('|');
        var datePart;
        if(milestone[1].substring(0,1)=="+"){
          var extractNumber = parseInt(milestone[1].substring(1,milestone[1].length));
          datePart = UIFunctions.addWorkingDaysToDate(prjStartDate,extractNumber);
        }
        else {
          datePart = milestone[1];
        }
        var thisMilestone = new UIFunctions.Milestone(datePart,milestone[2]);
        timeline.milestones.push(thisMilestone);
      }
    }
  }
  timeline.csd = csd;
  timeline.ced = ced;
  return timeline;
}

var parseCard = function(objCard){
  var description=splitDesc(objCard.desc);
  var newToPipeline = true;
  var prjStartDate = UIFunctions.shortUKDate($rootScope.today);
  if(description){
      newToPipeline = false;
      if(description.startDate){
      if(description.startDate!="undefined"){
        prjStartDate = description.startDate;
      }
    }
  }
  var projectName = removeSpiderRefs(objCard.name);
  ////console.log(projectName+":"+prjStartDate);
  var cardid=objCard.id;
  //build labels array
  var labels = [];
  angular.forEach(objCard.labels, function(value, key){
    labels.push({name:value["name"],color:value["color"]});
  });
  var project = new UIFunctions.Project(objCard.idList,projectName,objCard.id,objCard.shortUrl,objCard.due,objCard.desc);
  angular.forEach(description, function(value, key){
    project[key] = value;
  });
  project.newToPipeline = newToPipeline;
  project.labels=labels;
  var cardIDX = $rootScope.projects.push(project);
  if(objCard.idChecklists.length >0){
    //iterate checklists on card
    for(var i=0;i<objCard.idChecklists.length;i++){
      $http.get("https://trello.com/1/checklists/"+objCard.idChecklists[i]+"?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
      .success(function lookForTimeline(objCheckList){
        angular.forEach(objCheckList, function extractTimeline(v,k){
          if(k=="name" && v.toLowerCase()=="project timeline"){
            $rootScope.projects[cardIDX-1].timelineID = objCheckList.id;
            var timeline = parseProjectTimeline(objCheckList,projectName,prjStartDate);
            //add array of assignments to project
            $rootScope.projects[cardIDX-1].assignments=timeline.assignments;
            $rootScope.projects[cardIDX-1].milestones=timeline.milestones;
            ////console.log("Project:"+projectName);
            $rootScope.projects[cardIDX-1].calcStartDate=timeline.csd;
            $rootScope.projects[cardIDX-1].calcEndDate=timeline.ced;
            if(timeline.csd){
              var coords = UIFunctions.barCoords(timeline.csd,timeline.ced);
              $rootScope.projects[cardIDX-1].start = coords.start;
              $rootScope.projects[cardIDX-1].width = coords.width;
            }
            for(var n=0;n<timeline.assignments.length;n++){
              //update assignment bar locations based upon date
              UIFunctions.setBarPosition(timeline.assignments[n],project.colour);
              assignToStaff(timeline.assignments[n]);
            }
         }
        })
      })
    }
  }
}

function parseCards(objCardList,callback){
  objCardList.forEach(parseCard);
  callback;
}

/*
                                        
 # #    # # ##### #   ##   ##### ###### 
 # ##   # #   #   #  #  #    #   #      
 # # #  # #   #   # #    #   #   #####  
 # #  # # #   #   # ######   #   #      
 # #   ## #   #   # #    #   #   #      
 # #    # #   #   # #    #   #   ###### 
                                        
*/
    //initiate date
    if(typeof $rootScope.today =='undefined'){
    $rootScope.today = new Date();
    }
    $scope.offset = 0;
    $scope.allExpanded = true;
    $rootScope.startDate = $rootScope.today;//wowser - that's a hard set right there...

    $scope.trelloconfig = {
        boardID: "QUYFKlKu",
        projectBoards: "55dc3f991aa96888e248b54a",
        teams: "55dc7476c84945317bb853b9"
    };

    $scope.appStatus = {
        index:0,
        authorised: false,
        teams: false,
        boards: false,
        staff:false,
        projects:false
    };
    $scope.splash=true;
    $scope.startscreen=true;
    $scope.acctDropdown=false;
    $rootScope.staff=[];
    $rootScope.projects=[];
    $rootScope.ignoreLabels=["on hold","Awaiting sign off"];

//Have I got a token in local storage?
if(localStorage.getItem('trello_token')){
  console.log("yes");
  $scope.splash = false;
  $scope.startscreen=false;
  $scope.trelloToken=localStorage.getItem('trello_token');
  $http.get("https://trello.com/1/tokens/"+$scope.trelloToken+"/member?key="+$scope.trelloKey+"&token="+$scope.trelloToken)
.success($scope.go);
  }else{
  //This works, but requires a page refresh.
  //TrelloClient.authenticate();
}

$scope.go = function(member){
    $scope.loggedInUser = member;
    if(member.avatarHash.length>0){
      var avatarImg = "https://trello-avatars.s3.amazonaws.com/"+member.avatarHash+"/50.png";
    }
    else
    {
      var avatarImg = "/img/1x1transparent.png";
    }
    $scope.loggedInUser.avatarImg = avatarImg; 
  $scope.renderDayGrid($rootScope.today);
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
            $scope.appStatus.index++;
        }
    }, true)
    $scope.$watch('teams', function(newValue, oldValue, scope) {
        if (Array.isArray(newValue) && !Array.isArray(oldValue)) {
            $scope.appStatus.teams = 'built';
            $scope.appStatus.index++;
        }
    })

/*
                                                 
  ####   ####  #    # ##### #####   ####  #      
 #    # #    # ##   #   #   #    # #    # #      
 #      #    # # #  #   #   #    # #    # #      
 #      #    # #  # #   #   #####  #    # #      
 #    # #    # #   ##   #   #   #  #    # #      
  ####   ####  #    #   #   #    #  ####  ###### 
                                                 
*/

    $scope.$watch('appStatus', function(newValue, oldValue, scope) {
        console.log(newValue);
        if (newValue.boards == 'built' && newValue.teams == 'built' && !newValue.staff) {
            //we have both board & team objects, so we can proceed to build the staff object
            for (var board = 0; board < $scope.boards.length; board++) {
                $scope.boards[board].staff = [];
                //console.log($scope.boards[board]);
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
                            //$scope.boards[board - 1].staff.push(sm);//not sure about this "board-1" here... It seems to work, but not sure why
                            $rootScope.staff.push(sm);
                        });
                        staffCount++;
                        if(staffCount == response.length){
                            $scope.appStatus.staff="built";
                            $scope.appStatus.index++;
                        }
                    });
                });
            }
        }
        if(newValue.teams){
            //Persist filters between visits/refreshes
            if($cookieStore.get('showBoards')){
              var boardsToShow = JSON.parse(atob($cookieStore.get('showBoards')));
              if(boardsToShow !== null && typeof boardsToShow === 'object'){
                //console.log(boardsToShow);
                for(var n=0;n<boardsToShow.length;n++){
                  for(var i=0;i< $scope.trelloLists.length;i++){
                    if($scope.trelloLists[n].name==boardsToShow[i].name){
                      $scope.trelloLists[n].show = boardsToShow[i].show;
                    }
                  }
                }
              }
            }

            if($cookieStore.get('showTeams')){
              var teamsToShow = JSON.parse(atob($cookieStore.get('showTeams')));
              if(teamsToShow !== null && typeof teamsToShow === 'object'){
                //console.log(teamsToShow);
                for(var n=0;n<teamsToShow.length;n++){
                  for(var i=0;i< $scope.teams.length;i++){
                    if($scope.teams[n].name==teamsToShow[i].name){
                      $scope.teams[n].show = teamsToShow[i].show;
                    }
                  }
                }
              }
            }
        }
        if(newValue.staff && !newValue.projects){
            //ready to build projects object
            console.log("we can build projects now");
            //for(var n=0;n<$scope.boards.length;n++){
                //for(var i=0;i<$scope.boards[0].lists.length;i++){
                    //console.log($scope.boards[0].lists[i].id);
                    getCards($scope.boards[0].lists);
                   
                //}
            //}
        }
    }, true)
    //$scope.trelloToken = localStorage.getItem('trello_token');
    $http.get("https://trello.com/1/tokens/" + $scope.trelloToken + "/member?key=" + $scope.trelloKey + "&token=" + $scope.trelloToken).success(function(member) {
        authorised.resolve(member);
        $scope.appStatus.authorised = true;
        $scope.appStatus.index++;
    });
}

});
/*
 ####### ### #       ####### ####### ######   #####  
 #        #  #          #    #       #     # #     # 
 #        #  #          #    #       #     # #       
 #####    #  #          #    #####   ######   #####  
 #        #  #          #    #       #   #         # 
 #        #  #          #    #       #    #  #     # 
 #       ### #######    #    ####### #     #  #####  
                                                     
*/

pipeline.filter('validLabels',function($rootScope){
  return function (items) {
    var filtered =[];
    for (var i = 0; i < items.length; i++) {
      var pushme = true
      var item = items[i];
      ////console.log('Project:'+item.projectName)
      for(var n=0;n < item.labels.length; n++){
        ////console.log('labels: '+item.labels[n].name);
        for(var p=0;p<$rootScope.ignoreLabels.length;p++){
          if(item.labels[n].name == $rootScope.ignoreLabels[p]){
            pushme = false;
          }
        }
      }
      if(pushme){
        filtered.push(item);
      }
    }
    return filtered;
  }
})
