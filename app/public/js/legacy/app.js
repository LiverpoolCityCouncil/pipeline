'use strict';

angular.module('pipeline', [])
  .controller('TrelloController', function($scope,$rootScope, $http){
    var pendingTask;

/*
     #####    ##   ##### ######  ####  
     #    #  #  #    #   #      #      
     #    # #    #   #   #####   ####  
     #    # ######   #   #           # 
     #    # #    #   #   #      #    # 
     #####  #    #   #   ######  ####  
    */

      $scope.today = $rootScope.today;
      //initiate date
      if(typeof $rootScope.today =='undefined'){
      $rootScope.today = new Date();
      }
      $scope.today = $rootScope.today;
      $scope.offset = 0;

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
        $scope.staffMembers.forEach(parseAssignments);
      }

      $scope.fwdDate = function(){
        $scope.offset += 5;
        $rootScope.startDate=$rootScope.startDate.addDays(7);
        $scope.today = $rootScope.startDate;
        $scope.renderDayGrid($scope.today);
        $scope.staffMembers.forEach(parseAssignments);
      }

      $scope.thisWeek = function(){
        $scope.offset = 0;
        $rootScope.startDate=$rootScope.today;
        $scope.today = $rootScope.startDate;
        $scope.renderDayGrid($scope.today);
        $scope.staffMembers.forEach(parseAssignments);
      }


    /*
                                                                       
     #####  ###### #    # #####  ###### #####     #####    ##   #####  
     #    # #      ##   # #    # #      #    #    #    #  #  #  #    # 
     #    # #####  # #  # #    # #####  #    #    #####  #    # #    # 
     #####  #      #  # # #    # #      #####     #    # ###### #####  
     #   #  #      #   ## #    # #      #   #     #    # #    # #   #  
     #    # ###### #    # #####  ###### #    #    #####  #    # #    # 
                                                                       
    */  


      function renderBar(assignment){

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

            if(this[arrIdx].hours != 'off'){
              if(assignment.project == "Leave"){
                this[arrIdx].hours = 'off';
              }
              else
              {
                this[arrIdx].hours += parseInt(assignment.hours);
              }
            }
            if(this[arrIdx].hours == 'off'){
              this[arrIdx].cssClass='allocation-time-off-over';
            }
            else if(this[arrIdx].hours > this[30].workday){
              this[arrIdx].cssClass = "allocation-over";
            }
            else if(this[arrIdx].hours == this[30].workday){
              this[arrIdx].cssClass ="allocation-full";
            }
            else {this[arrIdx].cssClass="allocation-open-"+Math.ceil(this[30].workday-this[arrIdx].hours);
            }
          }
        }

        // set bar data in staffMember->assignment
        var barwidth = assignmentLength*60;   
        assignment.start = assignmentStartPos;
        assignment.width = barwidth;
      }

    /*                                                                     
       ##    ####   ####  #  ####  #    # #    # ###### #    # #####  ####  
      #  #  #      #      # #    # ##   # ##  ## #      ##   #   #   #      
     #    #  ####   ####  # #      # #  # # ## # #####  # #  #   #    ####  
     ######      #      # # #  ### #  # # #    # #      #  # #   #        # 
     #    # #    # #    # # #    # #   ## #    # #      #   ##   #   #    # 
     #    #  ####   ####  #  ####  #    # #    # ###### #    #   #    ####     
    */

    function parseAssignments(resource){
      var rn = resource.name.split(' ');
      resource.initials = rn[0].substr(0,1)+rn[1].substr(0,1);
      if (typeof resource.assignments != 'undefined'){
        //add array of capacity for visible 30 days of calendar
        //to this staffMember(resource)
        resource.capacity=[];
        for (n=0;n<30;n++){
          resource.capacity[n]={
            idx : n*60,
            hours: 0,
            cssClass : ''
          };
          //push an object detailing the workday into the end
          //of the capacity array
          resource.capacity.push({workday:resource.workday})
        }
        //loop each of this staffMembers Assignments
        //and render a bar
        //console.log(resource);
        resource.assignments.forEach(renderBar,resource.capacity);
        }
    }

//---------->existing page

    if($scope.search === undefined){
      fetch();
    }
$scope.renderDayGrid($scope.today);

    function fetch(){
      //fetch cards from list
      $scope.projects=[];
      var trellokey = "c21f0af5b9c290981a03256a73f5c5fa";
      var trellotoken = "ce497520ad564967346c36529eff2e65ab7b604f0dba95a3da8e4641c014ae60";
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

//callback example

function some_function2(url, callback) {
  var httpRequest; // create our XMLHttpRequest object
  if (window.XMLHttpRequest) {
    httpRequest = new XMLHttpRequest();
  } else if (window.ActiveXObject) {
    // Internet Explorer is stupid
    httpRequest = new
      ActiveXObject("Microsoft.XMLHTTP");
  }

  httpRequest.onreadystatechange = function() {
    // inline function to check the status
    // of our request
    // this is called on every state change
    if (httpRequest.readyState === 4 &&
        httpRequest.status === 200) {
      callback.call(httpRequest.responseXML);
      // call the callback function
    }
  };
  httpRequest.open('GET', url);
  httpRequest.send();
}
// call the function
some_function2("test.xml", function() {
  console.log(this);
});
console.log("bet I come first");








//--ends

    
    console.log($scope);

    }

    $scope.update = function(movie){
      $scope.search = movie.Title;
      $scope.change();
    };

    $scope.select = function(){
      this.setSelectionRange(0, this.value.length);
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