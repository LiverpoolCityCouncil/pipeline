'use strict';

var pipeline=angular.module('pipeline', ['ngLodash','ui.bootstrap'])
  .controller('TrelloController', function($scope,$rootScope, lodash, $http, UIFunctions){

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

/*

  ####  #       ####  #####    ##   #       ####
 #    # #      #    # #    #  #  #  #      #
 #      #      #    # #####  #    # #       ####
 #  ### #      #    # #    # ###### #           #
 #    # #      #    # #    # #    # #      #    #
  ####  ######  ####  #####  #    # ######  ####

*/


//initiate date
if(typeof $rootScope.today =='undefined'){
$rootScope.today = new Date();
}
$scope.offset = 0;
$scope.allExpanded = true;

/*

 #####    ##   #####   ##
 #    #  #  #    #    #  #
 #    # #    #   #   #    #
 #    # ######   #   ######
 #    # #    #   #   #    #
 #####  #    #   #   #    #

*/
function getstaff(){
//get Board Members
console.log("program step 7: Call trello and get board members - on success, pass to the 'BuildStaffObject' function");
$http.get("https://trello.com/1/boards/"+$rootScope.config.trelloBoard+"/members?key="+$rootScope.config.trelloKey+"&token="+$rootScope.config.trelloToken)
.success(buildStaffObject);

}

$scope.showItemsFromThisList = function(listID){
  //console.log ("showItemsFromThisList:"+listID);
  for(var n = 0;n < $rootScope.config.trelloLists.length;n++){
    if($rootScope.config.trelloLists[n].id == listID && $rootScope.config.trelloLists[n].show == true){
      return true;
    }
  }
  return false;
}

$scope.showMembersFromThisTeam = function(team){
  //console.log ("showItemsFromThisList:"+listID);
  for(var n = 0;n < $rootScope.config.teams.length;n++){
    if($rootScope.config.teams[n].name == team && $rootScope.config.teams[n].show == true){
      return true;
    }
  }
  return false;
}

var getCards =function getCards(arrList){
//get cards
  for(var n = 0;n < arrList.length;n++){
      $http.get("https://trello.com/1/lists/"+arrList[n].id+"/cards?key="+$rootScope.config.trelloKey+"&token="+$rootScope.config.trelloToken)
  .success(buildProjectsObject);
  }
}

function getLeaveObjects(){
//get new leave objects
console.log("step 5: get LeaveObjects() Call trello to get leave card, on success call 'parseLeaveObject' function");
  $http.get("https://trello.com/1/cards/"+$rootScope.config.leaveCardID+"/actions?key="+$rootScope.config.trelloKey+"&token="+$rootScope.config.trelloToken)
  .success(parseLeaveObject);
}

/*

 #    # ##### # #      # ##### # ######  ####
 #    #   #   # #      #   #   # #      #
 #    #   #   # #      #   #   # #####   ####
 #    #   #   # #      #   #   # #           #
 #    #   #   # #      #   #   # #      #    #
  ####    #   # ###### #   #   # ######  ####

*/
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
    console.log("in renderDayGrid function");

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
    console.log("daygrid complete");
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


/*

 #####    ##   #####   ####  ###### #####   ####
 #    #  #  #  #    # #      #      #    # #
 #    # #    # #    #  ####  #####  #    #  ####
 #####  ###### #####       # #      #####       #
 #      #    # #   #  #    # #      #   #  #    #
 #      #    # #    #  ####  ###### #    #  ####

*/
function dateOrdinal(inDate){
  var doParts = inDate.split("/");
  var dop = doParts[2]+doParts[1]+doParts[0];
  return dop;
}

function parseProjectTimeline(tl,projectName){
  //work out the calculated start date and end date here.
  var timeline = {assignments:[],milestones:[]};
  var csd=0;
  var ced=0;
  for(var n=0;n<tl.checkItems.length;n++){
    //don't bother with ticked off items
    if(tl.checkItems[n].state == 'incomplete'){
      if(tl.checkItems[n].name.substring(0,1)=="@"){
        var assignment=tl.checkItems[n].name.split('|');
        var hours = 7;
        if(assignment[3]){
          hours=assignment[3];
        }
        var staffMember = assignment[0].replace(' ','');//remove spaces from hand-cranked assignments!
        var dates=assignment[1].split('-');
        if(csd==0||dateOrdinal(dates[0])<dateOrdinal(csd)){
          csd = dates[0];
        }
        if(ced==0||dateOrdinal(dates[1])>dateOrdinal(ced)){
          ced = dates[1];
        }
        var thisAssignment = new UIFunctions.Assignment(timeline.id,projectName,staffMember,dates[0],dates[1],assignment[2],hours);
        thisAssignment.assignmentID=tl.checkItems[n].id;
        timeline.assignments.push(thisAssignment);
      }
      else if(tl.checkItems[n].name.substring(0,2)=="MS"){
        var milestone = tl.checkItems[n].name.split('|');
        var thisMilestone = new UIFunctions.Milestone(milestone[1],milestone[2]);
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
  if(description){
      newToPipeline = false;
  }
  var projectName = removeSpiderRefs(objCard.name);
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
      $http.get("https://trello.com/1/checklists/"+objCard.idChecklists[i]+"?key="+$rootScope.config.trelloKey+"&token="+$rootScope.config.trelloToken)
      .success(function lookForTimeline(objCheckList){
        angular.forEach(objCheckList, function extractTimeline(v,k){
          if(k=="name" && v.toLowerCase()=="project timeline"){
            $rootScope.projects[cardIDX-1].timelineID = objCheckList.id;
            var timeline = parseProjectTimeline(objCheckList,projectName);
            //add array of assignments to project
            $rootScope.projects[cardIDX-1].assignments=timeline.assignments;
            $rootScope.projects[cardIDX-1].milestones=timeline.milestones;
            //console.log("Project:"+projectName);
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

function parseLeaveObject(response){
  console.log("step6: in Parse LeaveObject Function.")
  console.log("LEAVE:");
  console.log(response);
  console.log("STAFF:");
  console.log($rootScope.staff)
  angular.forEach(response, function buildLeaveObject(v,k){
    if(v.type=='commentCard'){
      //console.log(v.data.text);
      var smName = v.data.text.split('|');
      //console.log(smName[0]);
      for (var n=0;n < $rootScope.staff.length; n++){
        //console.log($rootScope.staff[n].fullName);
        if($rootScope.staff[n].fullName == smName[0]){
          smName[0]=$rootScope.staff[n].userName;
        }
      }
      var leaveObject = smName.join('|');
      //console.log(leaveObject);
    }
  })
}

function parseCards(objCardList,callback){
  objCardList.forEach(parseCard);
  callback;
}

var buildProjectsObject = function(response){
  //$scope.rawList = response;
  parseCards(response,UIFunctions.parseStaffAssignments);
  //need a callback function on the end of here to call renderStaff
}

$scope.staffView=false;
$scope.projectsView=true;

var buildStaffObject = function(response){
  console.log("Build staff Object from response");
  console.log(response);
  console.log("Program step 8: create staff members")
  //iterate response, create new staffmember object for each, pump in contents.
  response.forEach(function(person){
    $http.get("https://trello.com/1/members/"+person.id+"/avatarhash?key="+$rootScope.config.trelloKey+"&token="+$rootScope.config.trelloToken)
    .success(function(response){
        if(response._value){
          var avatarImg = "https://trello-avatars.s3.amazonaws.com/"+response._value+"/50.png";
        }
        else
        {
          var avatarImg = "/img/1x1transparent.png";
        }
          var userNameMatch = '@'+person.username;
          var team = lodash.find($rootScope.config.teams,{members:[userNameMatch]});
          var sm = new UIFunctions.StaffMember(person.fullName,person.id,userNameMatch,avatarImg,team.name);
          $rootScope.staff.push(sm);
    });
  });
getCards($rootScope.config.trelloLists);
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


/*

  #####  ####### ### ###
 #     # #     # ### ###
 #       #     # ### ###
 #  #### #     #  #   #
 #     # #     #
 #     # #     # ### ###
  #####  ####### ### ###

*/



//parse out new leave items (these come in as comments to the leave ticket as thats all Zapier can do)


console.log("program step 1: Defining main functions");

var mainFunctionLoop = function(config){
  console.log("program step 4: Into Main Function Loop");
  console.log("rootScope should now have a config element");
  console.log("rootScope:");
  console.log($rootScope);
  //getLeaveObjects();-->This doesn't DO anything :-)
  console.log("program step 5: render day grid");
  $scope.renderDayGrid($rootScope.today);
  console.log("program step 6: get staff");
  getstaff();
  //console.log($rootScope);
  //console.log($scope);
}

var getTrelloConfig = function(configBoard,mainFunctionLoop){
  console.log("program step 2: in GetTrelloConfig function");
  var config={};
  config.lists=[];
  config.configBoard = configBoard;
  config.trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";
  config.trelloToken = "ce497520ad564967346c36529eff2e65ab7b604f0dba95a3da8e4641c014ae60";
  //Let's go get some config...
  $http.get("https://trello.com/1/boards/"+configBoard+"/lists?cards=none&card_fields=all&filter=open&fields=all&key="+config.trelloKey+"&token="+config.trelloToken)
  .success(function(response){
    config.lists.trelloBoards = lodash.find(response,{name:"Project Boards"});
    config.lists.teams = lodash.find(response,{name:"Teams"});
    config.lists.CardConfigs = lodash.find(response,{name:"Card configs"});
    config.lists.ignoreLabels = lodash.find(response,{name:"Labels to ignore"});
    config.lists.ContentLists = lodash.find(response,{name:"content lists"});
    config.trelloBoards=[];

    //Get the boards & lists
    $http.get("https://trello.com/1/lists/"+config.lists.trelloBoards.id+"/cards?key="+config.trelloKey+"&token="+config.trelloToken)
    .success(function(boards){
      for(var n=0;n<boards.length;n++){
        var cardDeets = boards[n].name.split(' [');
        var boardName=cardDeets[0];
        var boardID=(cardDeets[1]).substr(0,cardDeets[1].length-1);
        config.trelloBoards[n]={name:boardName,trelloLists:[],boardID:boardID,checklistID:boards[n].idChecklists[0]};
        $scope.n = n;
        $http.get("https://trello.com/1/checklists/"+config.trelloBoards[n].checklistID+"?key="+config.trelloKey+"&token="+config.trelloToken)
        .success(function(checklist){
           for(var i=0;i<checklist.checkItems.length;i++){
            var listDeets = checklist.checkItems[i].name.split(' [');
            var listName=cardDeets[0];
            var listID=(cardDeets[1]).substr(0,cardDeets[1].length-1);
            config.trelloBoards[$scope.n].trelloLists.push({idx:i,id:listID,name:listName});
           }
        });
      }
    });

    config.teams=[];
    $http.get("https://trello.com/1/lists/"+config.lists.teams.id+"/cards?key="+config.trelloKey+"&token="+config.trelloToken)
    .success(function(teams){
      console.log("TEAMS:");
      console.log(teams);
      for(var team=0;team<teams.length;team++){
        //Get the Members checklist

        // doesn't work as "team.checklists" isn't a real object - going to have to iterate
        // the ids in idChecklists, then go find the list with the name "Members" (the hard way)
        //
        // --->
        // var membersChecklist=lodash.find(team.checklists,{name:"Members"});
        // console.log("membersChecklist");
        // console.log(team.checklists);
        // config.teams[team]={name:team.name,show:true,members:[],checklistID:membersChecklist.id};
        // $scope.tm=team;
        // $http.get("https://trello.com/1/checklists/"+config.teams[team].checklistID+"?key="+config.trelloKey+"&token="+config.trelloToken)
        // .success(function(checklist){
        //   console.log(checklist);
        //   <------
        });
      }
    });

  });
  console.log("config from remote");
  console.log(config);
  //Board & lists come from cards in the "Project Boards" list.
  //The Card contains the board Name and [ID] in the title, with a
  //checklist of lists(each containing List name and [ID])

  //config.colours = ["orange","aqua","blue","purple","red","gray","green"];
  //var trelloBoard="jZalCdKy"; //Pipeline Development Board (dev)
  //config.trelloBoard="544e2d207ad565ce3a4cc4f4"; //Spider Trello (live)
  //var trelloLists =[{idx:0,id:"5698e74d97f46633fb16fae1",name:"stage 3",show:true},{idx:1,id:"5698e7959464b05bb6595a8c",name:"BAU",show:true}]; //dev
  //config.trelloLists =[{idx:0,id:"544e2d3763f8d35dd44bb153",name:"stage 3",show:true},{idx:1,id:"547315b58b585dca845fc24b",name:"BAU",show:true},{idx:1,id:"5645e743fc62fc449d543e31",name:"Scheduled Maintenance",show:true}]; //live
  //config.ignoreLabels=["on hold","Awaiting sign off"];
  // config.teams = [
  // {
  //   name:'UX',
  //   members:['@oddjones','@chatmandu','@leeeaseman','@jayneedwards','@markallen16'],
  //   show:true
  // },
  // {
  //   name:'Development',
  //   members:['@annmarieflynn','@dominicreid','@eugenecook','@johnsmith5','@katenorth1','@kevincann','@neilnorpa'],
  //   show:true
  // },
  // {
  //   name:'Projects',
  //   members:['@iangeer','@jamesjennings1','@jonathanglynn','@chrisreynolds2'],
  //   show:true
  // },
  // {
  //   name:'Content',
  //   members:['@andreajones2','@sophiebaines1'],
  //   show:true
  // },
  // {
  //   name:'Support',
  //   members:['@davcoops','@lynchj3','@paullfc','@sheagraffin','@martinatherton1'],
  //   show:true
  // },
  // {
  //   name:'Management',
  //   members:['@ckx79','@mikeranscombe','@willcostello'],
  //   show:false
  // },
  // {
  //   name:'System',
  //   members:['@pipelinebot','@DEATH','@lccwebrobot'],
  //   show:false
  // }];
  // config.colours=[{name:'orange'},{name:'green'},{name:'aqua'},{name:'blue'},{name:'yellow'},{name:'salmon'},{name:'pink'},{name:'mint'},{name:'grass'},{name:'purple'},{name:'magenta'},{name:'red'},{name:'grey'},{name:'black'}];
  // //config.leaveCardID='8GPkKF0V';//dev
  // config.leaveCardID='J4pZMxUW';//live
  $scope.teams = config.teams;
  $scope.trelloLists = config.trelloLists;
  $rootScope.projects=[];
  $rootScope.staff=[];
  $rootScope.config = config;
  console.log("program step 3: Config defined");
  //console.log("config:");
  //console.log(config);
  mainFunctionLoop(config);
}
var configBoard = "QUYFKlKu"
getTrelloConfig(configBoard,mainFunctionLoop);

});



pipeline.filter('validLabels',function($rootScope){
  console.log("rootScope:");
  console.log($rootScope);
  return function (items) {
    var filtered =[];
    for (var i = 0; i < items.length; i++) {
      var pushme = true
      var item = items[i];
      //console.log('Project:'+item.projectName)
      for(var n=0;n < item.labels.length; n++){
        //console.log('labels: '+item.labels[n].name);
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
