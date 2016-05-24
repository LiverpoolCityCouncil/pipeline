angular.module('pipeline')
.factory('UIFunctions',function UIFunctionsFactory($rootScope,$http,$filter){

/*

  ####   ####  #    #  ####  ##### #####  #    #  ####  #####  ####  #####   ####
 #    # #    # ##   # #        #   #    # #    # #    #   #   #    # #    # #
 #      #    # # #  #  ####    #   #    # #    # #        #   #    # #    #  ####
 #      #    # #  # #      #   #   #####  #    # #        #   #    # #####       #
 #    # #    # #   ## #    #   #   #   #  #    # #    #   #   #    # #   #  #    #
  ####   ####  #    #  ####    #   #    #  ####   ####    #    ####  #    #  ####

*/

var StaffMember =function(fullName,id,userName,avatarhash,team){
  this.fullName = fullName;
  this.id = id;
  this.userName = userName;
  this.avatar = avatarhash;
  this.assignments = [];
  this.workday = 7;
  this.capacity=[];
  this.team = team;
  for(var i=0;i<30;i++){
    var emptyCapacityItem = new CapacityItem(60*i,0,'');
    this.capacity.push(emptyCapacityItem);
  }
}

var Project = function (listID,projectName,projectId,trelloUrl,deadline,notes){
    this.listID = listID;
    this.projectName = projectName;
    this.id = projectId;
    this.trelloURL = trelloUrl;
    this.deadline = deadline;
    this.notes = notes;
    this.assignments = [];
    this.milestones = [];
    this.timelineID = 0;
    this.colour="blue";
    this.pm="@bender";
    this.startDate="undefined";
}

var Assignment = function (projectID,projectName,resource,startDate,endDate,notes,hours){
    this.projectID = projectID;
    this.projectName = projectName;
    this.resource = resource;
    this.startDate = startDate;
    this.endDate = endDate;
    this.notes = notes;
    this.colour = 'blue';
    this.start = 0;
    this.width = 0;
    this.hours = hours;
}

var CapacityItem = function (idx,hours,cssClass){
  this.idx = idx;
  this.hours = 0;
  this.cssClass='';
}

var shortUKDate = function(dateToParse){
  var strDate = $filter('date')(dateToParse, 'dd/MM/yyyy');
  return strDate;
}

var Milestone = function(date,name){
  this.name=name;
  this.date=date;
}

var parseDMY = function(value) {
    var date = value.split("/");
    var d = parseInt(date[0], 10),
        m = parseInt(date[1], 10),
        y = parseInt(date[2], 10);
    return new Date(y, m - 1, d);
}

var renderStaffBar = function(assignment,colour,capacity){

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

    //Calculate Hours worked and place in the this.capacity array

    for(var d=0;d<assignmentLength;d++)
    //iterate through the days of this assignment
    {
      //are we actually onscreen?(our capacity array only accounts for the visible portion of the screen)
      if((daysFromCalHome+d)>=0 && (daysFromCalHome+d) <30){

      //arrIdx is the index position within the 30 day capacity array (this) of the current day (d)
      var arrIdx=parseInt(daysFromCalHome)+d;

      if(capacity[arrIdx].hours != 'off'){
        if(assignment.projectName == "* LEAVE *"){
          capacity[arrIdx].hours = 'off';
        }
        else
        {
          capacity[arrIdx].hours += parseInt(assignment.hours);
        }
      }
      if(capacity[arrIdx].hours == 'off'){
        capacity[arrIdx].cssClass='allocation-time-off';
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

}

var workingDaysBetweenDates =function(startDate, endDate) {

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

var getDateFromUKFormatString = function(ukDate){
  var splitme=ukDate.split("/");
  var dateToReturn = new Date(parseInt(splitme[2]),parseInt(splitme[1])-1,parseInt(splitme[0]));
  return dateToReturn;
}

function addWorkingDaysToDate(startDate,days) { //myDate = starting date, days = no. working days to add.
    var myDate=getDateFromUKFormatString(startDate);
    var temp_date = new Date();
    var i = 0;
    var days_to_add = 0;
    while (i < (days)){
      temp_date = new Date(myDate.getTime() + (days_to_add*24*60*60*1000));
				//0 = Sunday, 6 = Saturday, if the date not equals a weekend day then increase by 1
				if ((temp_date.getDay() != 0) && (temp_date.getDay() != 6)){
					i+=1;
				}
				days_to_add += 1;
			}
		return shortUKDate(new Date(myDate.getTime() + days_to_add*24*60*60*1000));
}

var barCoords = function(start,end){
  var sdArray = start.split('/');
  var startDate = new Date(sdArray[2],sdArray[1]-1,sdArray[0],0,0,1,1);
  var edArray = end.split('/');
  var endDate = new Date(edArray[2],edArray[1]-1,edArray[0],23,59,59,999);
  var dateDiff = workingDaysBetweenDates($rootScope.startDate, startDate);
  var daysFromCalHome = dateDiff-1;
  var StartPos = daysFromCalHome*60;
  var Length = workingDaysBetweenDates(startDate, endDate)*60;
  var output = {
    start:StartPos,
    width:Length
  };
  return output;
}

var setBarPosition = function(assignment,colour){

  var coords = barCoords(assignment.startDate,assignment.endDate);
  assignment.start = coords.start;
  assignment.width = coords.width;
  if(colour){
  assignment.colour = colour;
  }
}

var parseStaffAssignments = function(){
	$rootScope.staff.forEach(function(staffMember){
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

var parsePrjAssignments = function(){
	$rootScope.projects.forEach(function(project){
    if(project.calcStartDate){
      var coords = barCoords(project.calcStartDate,project.calcEndDate);
      project.start = coords.start;
      project.width = coords.width;
    }
	  project.assignments.forEach(function(assignment,colour){
	    setBarPosition(assignment,project.colour);
	  })
    if(project.ced > project.deadline){
      project.colour = "red";
    }
	});
  //console.log("$rootScope.startdate:"+$rootScope.startDate);
  //console.log("$rootScope.today:"+$rootScope.today);
}

var postAssignmentToTrello = function(project,shorthand){
  var trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";
  var trelloToken = "ce497520ad564967346c36529eff2e65ab7b604f0dba95a3da8e4641c014ae60";

  if(project.timelineID == 0){
      $http.post('/createTimeline', {projectid:project.id,name: shorthand, key:trelloKey,token:trelloToken})
      .then(function(response){
        console.log(response);
        $http.post('/addAssignment', {name: shorthand,projectid: project.id,timeline:response.data.id,key:trelloKey,token:trelloToken})
      .then(function(response){
        //console.log(response);
        //I could actually refresh the objects here...
      },function(response){
        //console.log('error');
        //console.log(response);
      });
        //I could actually refresh the objects here...
      },function(response){
        //console.log('error');
        //console.log(response);
      });
  }
  else
  {
    $http.post('/addAssignment', {name: shorthand,projectid: project.id,timeline:project.timelineID,key:trelloKey,token:trelloToken})
      .then(function(response){
        //console.log(response);
        //I could actually refresh the objects here...
      },function(response){
        //console.log('error');
        //console.log(response);
      });
  }
}

var updateAssignmentInTrello = function(project,assignment,shorthand){
  var trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";
  var trelloToken = "ce497520ad564967346c36529eff2e65ab7b604f0dba95a3da8e4641c014ae60";
  $http.put('/updateAssignment', {name: shorthand,projectid:project.id,timeline:project.timelineID,assignmentID:assignment.assignmentID,key:trelloKey,token:trelloToken})
    .then(function(response){

    },function(response){

    })
}

var updateTrelloProject = function(project){
  var trelloKey = "c21f0af5b9c290981a03256a73f5c5fa";
  var trelloToken = "ce497520ad564967346c36529eff2e65ab7b604f0dba95a3da8e4641c014ae60";
  $http.put('/updateProject', {id: project.id,name: project.projectName,desc:project.notes,due:project.deadline,key:trelloKey,token:trelloToken})
    .then(function(response){

    },function(response){

    })
}

var testme = function(){
			console.log("testme function");
			console.log($rootScope);
		}



	return{
		testme: testme,
    barCoords: barCoords,
		parseStaffAssignments: parseStaffAssignments,
		parsePrjAssignments: parsePrjAssignments,
		setBarPosition: setBarPosition,
		workingDaysBetweenDates: workingDaysBetweenDates,
		renderStaffBar: renderStaffBar,
		StaffMember: StaffMember,
		Assignment: Assignment,
		Project: Project,
		CapacityItem: CapacityItem,
    postAssignmentToTrello: postAssignmentToTrello,
    updateAssignmentInTrello: updateAssignmentInTrello,
    updateTrelloProject: updateTrelloProject,
    Milestone: Milestone,
    parseDMY: parseDMY,
    shortUKDate: shortUKDate,
    addWorkingDaysToDate: addWorkingDaysToDate,
    getDateFromUKFormatString: getDateFromUKFormatString
		//---
	}
});
