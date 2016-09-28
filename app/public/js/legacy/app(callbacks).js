'use strict';

angular.module('pipeline', ['ngLodash','ui.bootstrap'])
  .controller('TrelloController', function($scope,$rootScope, lodash, $http){

/*
                                                                                                                                                              
  ####   ####  #    #  ####  ##### #####  #    #  ####  #####  ####  #####   ####  
 #    # #    # ##   # #        #   #    # #    # #    #   #   #    # #    # #      
 #      #    # # #  #  ####    #   #    # #    # #        #   #    # #    #  ####  
 #      #    # #  # #      #   #   #####  #    # #        #   #    # #####       # 
 #    # #    # #   ## #    #   #   #   #  #    # #    #   #   #    # #   #  #    # 
  ####   ####  #    #  ####    #   #    #  ####   ####    #    ####  #    #  ####  
                                                                                                                                                              
*/

function StaffMember(fullName,id,userName,avatarhash){
  this.fullName = fullName;
  this.id = id;
  this.userName = userName;
  this.avatar = avatarhash;
  this.assignments = [];
  this.workday = 7;
  this.capacity=[];
}

function Project(projectName,projectId,trelloUrl,startDate,deadline,notes){
    this.projectName = projectName;
    this.id = projectId;
    this.trelloURL = trelloUrl;
    this.startDate =startDate;
    this.deadline = deadline;
    this.notes = notes;
    this.assignments = [];
}

function Assignment(projectID,projectName,resource,startDate,endDate,notes,hours,colour,start,width){
    this.projectID = projectID;
    this.projectName = projectName;
    this.resource = resource;
    this.startDate = startDate;
    this.endDate = endDate;
    this.notes = notes;
    this.colour = colour;
    this.start = start;
    this.width = width;
    this.hours = hours;
}

function CapacityItem(idx,hours,cssClass){
  this.idx = 0;
  this.hours = 0;
  this.cssClass='';
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

/*
                                                  
  ####  #       ####  #####    ##   #       ####  
 #    # #      #    # #    #  #  #  #      #      
 #      #      #    # #####  #    # #       ####  
 #  ### #      #    # #    # ###### #           # 
 #    # #      #    # #    # #    # #      #    # 
  ####  ######  ####  #####  #    # ######  ####  
                                                  
*/

var colours = ["orange","aqua","blue","purple","red","gray","green"];
var trelloBoard="552fc643c7e7098279146341";
var trelloList ="55916f3624405fba862eede7"; 
var trelloKey = "YOUR TRELLO KEY";
var trelloToken = "YOUR TRELLO TOKEN";
$scope.projects =[];
$rootScope.projects=[];
$scope.staff=[];

//initiate date
if(typeof $rootScope.today =='undefined'){
$rootScope.today = new Date();
}
$scope.today = $rootScope.today;
$scope.offset = 0;

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
$http.get("https://trello.com/1/boards/"+trelloBoard+"/members?key="+trelloKey+"&token="+trelloToken)
.success(renderStaff);

}

var getCards =function getCards(){
//get cards
$http.get("https://trello.com/1/lists/"+trelloList+"/cards?key="+trelloKey+"&token="+trelloToken)
.success(renderProjects);
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
    $rootScope.startDate = startDate;

    //we want the next 30 working days (Mon-Fri)

    $scope.weekGrid=[];
    for(var w=0;w<6;w++){
      var weekIdx = startDate.getWeek();
      //console.log(weekIdx);
      var weekDays=[];
      for(var d=0;d<5;d++){
      var thisDay = startDate.addDays(dayCount);
      var activeClass="";
      if (thisDay.getDate()==today.getDate() && thisDay.getMonth() == today.getMonth()){
        activeClass="today";
      }
      else
        {activeClass="";}
        weekDays.push({
        date:thisDay.getDate(),
        today:activeClass,
        month:$rootScope.monthNames[thisDay.getMonth()],
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
    $scope.today = $rootScope.startDate;
    $scope.renderDayGrid($scope.today);
    parseAssignments();
  }

  $scope.fwdDate = function(){
    $scope.offset += 5;
    $rootScope.startDate=$rootScope.startDate.addDays(7);
    $scope.today = $rootScope.startDate;
    $scope.renderDayGrid($scope.today);
    parseAssignments();
  }

  $scope.thisWeek = function(){
    $scope.offset = 0;
    $rootScope.startDate=$rootScope.today;
    $scope.today = $rootScope.startDate;
    $scope.renderDayGrid($scope.today);
    parseAssignments();
  }

/*
                                                  
 #####    ##   #####   ####  ###### #####   ####  
 #    #  #  #  #    # #      #      #    # #      
 #    # #    # #    #  ####  #####  #    #  ####  
 #####  ###### #####       # #      #####       # 
 #      #    # #   #  #    # #      #   #  #    # 
 #      #    # #    #  ####  ###### #    #  ####  
                                                  
*/



function getAssignmentsFromTimeline(timeline,projectName){
  var assignments = [];
  angular.forEach(timeline.checkItems, function(value, key){
    angular.forEach(value, function(value,key){
      if(key=="name"){
      var assignment=value.split('|');
      var hours = 7;
      if(assignment[3]){
        hours=assignment[3];
      }
      var dates=assignment[1].split('-');
      //Assignment(projectID,projectName,resource,startDate,endDate,notes,hours,colour,start,width)
      var thisAssignment = new Assignment(timeline.id,projectName,assignment[0],dates[0],dates[1],assignment[2],hours,'','','');
      assignments.push(thisAssignment);
    }
    })
  });
  return assignments;
}



var parseProjects = function(objCard){
  var description=splitDesc(objCard.desc);
  //push to projects array
  var cardid=objCard.id;
  var project = new Project(objCard.name,objCard.id,objCard.shortUrl,description.startDate,objCard.due,description.desc);
  var cardIDX = $scope.projects.push(project);
  $rootScope.projects.push({
    projectName: objCard.name,
    id: objCard.id
  });
  if(objCard.idChecklists.length >0){
    //iterate checklists on card
    for(var i=0;i<objCard.idChecklists.length;i++){
      $http.get("https://trello.com/1/checklists/"+objCard.idChecklists[i]+"?key="+trelloKey+"&token="+trelloToken)
      .success(function lookForTimeline(objCheckList){
        angular.forEach(objCheckList, function extractTimeline(v,k){
          if(k=="name" && v=="Project Timeline"){
            var assignments = getAssignmentsFromTimeline(objCheckList,objCard.name);
            $scope.projects[cardIDX-1].assignments=assignments;
            for(var n=0;n<assignments.length;n++){
              renderProjectBar(assignments[n],colours[n]);
              assignToStaff(objCard.name,assignments[n]);
            }
          }
        })
      })
    }
  }
}


function parseAssignments(){
$scope.projects.forEach(function(project){
  project.assignments.forEach(function(assignment,colour){
    renderProjectBar(assignment);
  })
});
$scope.staff.forEach(function(staffMember){
  staffMember.capacity=[];
  for (var n=0;n<30;n++){
    staffMember.capacity[n]={
      idx : n*60,
      hours: 0,
      cssClass : ''
    };
    //push an object detailing the workday into the end
    //of the capacity array
    staffMember.capacity.push({workday:staffMember.workday})
  }
  staffMember.assignments.forEach(function(assignment,colour,capacity){
    renderStaffBar(assignment,colour,staffMember.capacity);
  })
})
}

function parseStaffAssignments(staffObj){
  $scope.staff.push(staffObj);
}

var renderProjects = function(response){
  $scope.rawList = response;
  $scope.rawList.forEach(parseProjects);
  //need a callback function on the end of here to call renderStaff
}

$scope.staffView=false;
$scope.projectsView=true;

var renderStaff = function(response){
  //iterate response, create new staffmember object for each, pump in contents.
  response.forEach(function(person){
    $http.get("https://trello.com/1/members/"+person.id+"/avatarhash?key="+trelloKey+"&token="+trelloToken)
    .success(function(response){
        if(response._value){
          var avatarImg = "https://trello-avatars.s3.amazonaws.com/"+response._value+"/50.png";
        }
        else
        {
          var avatarImg = "/img/1x1transparent.png";
        }
          var sm = new StaffMember(person.fullName,person.id,person.username,avatarImg);
          $scope.staff.push(sm);
    });
  });
  //at this point I've built the staff object...
  //could I put the get cards here?
  getCards();
  //Why yes! I could :-) but I'd be happier with it as a callback.
}

function assignToStaff(prjName,assignment){
  var resource = assignment.resource.split('@');
  var staffAssignment = {
    projectName: prjName,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    notes: assignment.notes,
    colour: assignment.colour,
    start: assignment.start,
    width: assignment.width,
    hours: assignment.hours
  };
  $scope.staff.forEach(function(person){
    if(person.userName == resource[1]){
      person.assignments.push(staffAssignment);
    }
  });
}


/*
                                                                       
#####  ###### #    # #####  ###### #####     #####    ##   #####  
#    # #      ##   # #    # #      #    #    #    #  #  #  #    # 
#    # #####  # #  # #    # #####  #    #    #####  #    # #    # 
#####  #      #  # # #    # #      #####     #    # ###### #####  
#   #  #      #   ## #    # #      #   #     #    # #    # #   #  
#    # ###### #    # #####  ###### #    #    #####  #    # #    # 
                                                                 
*/  


function renderProjectBar(assignment,colour){

  // "this" is passed in as the staffMember's capacity 
  //console.log(assignment);
  var sdArray = assignment.startDate.split('/');
  var startDate = new Date(sdArray[2],sdArray[1]-1,sdArray[0],0,0,1,1);
  var edArray = assignment.endDate.split('/');
  var endDate = new Date(edArray[2],edArray[1]-1,edArray[0],23,59,59,999);

  // Establish the number of working days between the start of this assignment (startDate) and the beginning of our visible calendar (rootScope.startDate or calHome) = dateDiff

  var dateDiff = workingDaysBetweenDates($rootScope.startDate, startDate);

  var daysFromCalHome = dateDiff-1;
  // daysFromCalHome is the difference in days between the start of this assignment from the calendar start (+ or -) we subtract 1 to account for zero based array.

  var assignmentStartPos = daysFromCalHome*60;//
  var assignmentLength = workingDaysBetweenDates(startDate, endDate);

  // set bar data in project->assignment
  var barwidth = assignmentLength*60;   
  assignment.start = assignmentStartPos;
  assignment.width = barwidth;
  if(colour){
  assignment.colour = colour;
  }
}


function renderStaffBar(assignment,colour,capacity){
  //console.log(capacity);
  // "this" is passed in as the staffMember's capacity 

  var sdArray = assignment.startDate.split('/');
  var startDate = new Date(sdArray[2],sdArray[1]-1,sdArray[0],0,0,1,1);
  var edArray = assignment.endDate.split('/');
  var endDate = new Date(edArray[2],edArray[1]-1,edArray[0],23,59,59,999);

  // Establish the number of working days between the start of this assignment (startDate) and the beginning of our visible calendar (rootScope.startDate or calHome) = dateDiff

  var dateDiff = workingDaysBetweenDates($rootScope.startDate, startDate);

  var daysFromCalHome = dateDiff-1;
  // daysFromCalHome is the difference in days between the start of this assignment from the calendar start (+ or -) we subtract 1 to account for zero based array.

  var assignmentStartPos = daysFromCalHome*60;//
  var assignmentLength = workingDaysBetweenDates(startDate, endDate);

    //Calculate Hours worked and place in the this.capacity array

    for(var d=0;d<assignmentLength;d++)
    //iterate through the days of this assignment
    {
      //are we actually onscreen?(our capacity array only accounts for the visible portion of the screen)
      if((daysFromCalHome+d)>=0 && (daysFromCalHome+d) <30){

      //arrIdx is the index position within the 30 day capacity array (this) of the current day (d)
      var arrIdx=parseInt(daysFromCalHome)+d;

      if(!capacity[arrIdx]){
        capacity[arrIdx] = new CapacityItem();
      }

      if(capacity[arrIdx].hours != 'off'){
        if(assignment.projectName == "LEAVE"){
          capacity[arrIdx].hours = 'off';
        }
        else
        {
          capacity[arrIdx].hours += parseInt(assignment.hours);
        }
      }
      if(capacity[arrIdx].hours == 'off'){
        capacity[arrIdx].cssClass='allocation-time-off-over';
      }
      else if(capacity[arrIdx].hours > 7){
        capacity[arrIdx].cssClass = "allocation-over";
      }
      else if(capacity[arrIdx].hours == 7){
        capacity[arrIdx].cssClass ="allocation-full";
      }
      else {capacity[arrIdx].cssClass="allocation-open-"+(7-capacity[arrIdx].hours);
      }
    }
  }

  // set bar data in staffMember->assignment
  var barwidth = assignmentLength*60;   
  assignment.start = assignmentStartPos;
  assignment.width = barwidth;
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


$scope.renderDayGrid($scope.today);
getstaff();

    console.log($scope);

});

