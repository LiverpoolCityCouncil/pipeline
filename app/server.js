/*
Following youtube video at : 

basic express framework from documentation at: http://expressjs.com/4x/api.html

dependencies : 

request: for doing API calls to Trello (https://github.com/request/request#requestoptions-callback)
body-parser: for parsing JSON
async: for the multi-API call JSON forEachery (https://github.com/caolan/async)



*/
var request = require("request");
var express = require('express');
var async = require('async');
var app = express();
var bodyParser = require('body-parser');
//var trelloBoard="55decf413d5ceb981dfcb15e"; // Spider Trello (LIVE!)
var trelloBoard="jZalCdKy"; // Pipeline Development Board (dev)

var trelloList ="55ded9966dd99cded024ac7a"; 
var trelloKey = "YOUR TRELLO KEY";
var trelloToken = "YOUR TRELLO TOKEN";
var pipelineConfigBoard = '55dc3f6f1135e1887b3dbe11'; //unused (so far)

app.use(bodyParser.json())

// GET /style.css etc - serve static content at current directory
app.use(express.static(__dirname + '/public'));
app.use('/template', express.static(__dirname + '/template'));

/*get Board Config
app.get("/boardConfig", function(req,res){
	var boardConfig=request({
		uri:"https://trello.com/1/boards"+pipelineConfigBoard+,
		method:"GET"
	}, function(error,response,body){

	});
});*/

//get board Members
app.get("/staffMembers",function(req,res){
	var staffMembers= request({
		uri:"https://trello.com/1/boards/"+trelloBoard+"/members?key="+trelloKey+"&token="+trelloToken,
		method: "GET"
	},function(error,response,body){
		var jsonbody = JSON.parse(body);
		res.json(jsonbody);
	});	
});

app.get("/tokenmember/:token",function(req,res){
	var token = req.params.token;
	var member = request({
		uri:"https://trello.com/1/tokens/"+token+"/member?key="+trellokey+"&token="+token,
		method:"GET"
	},function(error,response,body){
		var jsonbody = JSON.parse(body);
		res.json(jsonbody);
	})
})

//return projects from trello list
app.get("/trelloProjects",function(req, res){
	var trelloProjects = request({
		//get the cards
		uri:"https://trello.com/1/lists/"+trelloList+"/cards?key="+trelloKey+"&token="+trelloToken,
		method: "GET"
	},function(error,response,body){
		var jsonbody=JSON.parse(body);
		var output=[];
		//iterate the cards, build our projects object for each
		async.forEachOf(jsonbody,function(value,key,callback){
			var description=splitDesc(value.desc);
			var project = ({
				projectName:value.name,
				id:value.id,
				trelloURL:value.shortUrl,
				startdate:description.startDate,
				deadline:value.due,
				notes: description.desc
			});
			var mylist = getTimelineFromCard(value);
			//console.log(mylist);
			output.push(project);
		})
		res.json(output);
	});	
});

//get an avatar image
app.get("/avatar/:id",function(req,res){
	var id = req.params.id;
	//console.log(id);
	var avatarImg = request({
		uri:"https://trello.com/1/members/"+id+"/avatarhash?key="+trelloKey+"&token="+trelloToken,
		method: "GET"
	},function(error,response,body){
		var jsonbody=JSON.parse(body);
		res.json(jsonbody);
	})
})

app.post("/addAssignment",function(req, res){
//console.log(req);
	var postAssignment = request({
		uri: 'https://trello.com/1/cards/'+req.body.projectid+'/checklist/'+req.body.timeline+'/checkitem?key='+req.body.key+'&token='+req.body.token,
		method: "POST",
		form: {name: req.body.name}
		},function(error,response,body){
		var jsonbody=JSON.parse(body);
		res.json(jsonbody);
	})
});
//https://trello.com/1/cards/55f289ed1b2e7ca1143edda1/checklist/55f2e23ff401af6d116e2647/checkitem/55f2e2634e3c760c5d4e5f56/name?key=YOUR TRELLO KEY&token=YOUR TRELLO TOKEN
app.put("/updateAssignment",function(req, res){
	console.log("PUT");
	console.log("projectID: "+req.body.projectid);
	console.log("shorthand: "+req.body.name);
	console.log("timeline: "+req.body.timeline);
	console.log("assignment: "+req.body.assignmentID);
	var updateAssignment = request({
		uri: 'https://trello.com/1/cards/'+req.body.projectid+'/checklist/'+req.body.timeline+'/checkitem/'+req.body.assignmentID+'/name?key='+req.body.key+'&token='+req.body.token,
		method: "PUT",
		form: {value: req.body.name}
		},function(error,response,body){
			//var jsonbody=JSON.parse(body);
			//res.json(jsonbody);
	})
});

app.put("/updateProject",function(req,res){
	console.log("PUT");
	console.log("id: "+req.body.id);
	console.log("name: "+req.body.name);
	console.log("desc: "+req.body.desc);
	console.log("due: "+req.body.due);
	console.log("assignment: "+req.body.due);
	var updateDesc = request({
		uri: 'https://trello.com/1/cards/'+req.body.id+'/desc?key='+req.body.key+'&token='+req.body.token,
		method: "PUT",
		form: {value: req.body.desc}
		},function(error,response,body){
			//var jsonbody=JSON.parse(body);
			//res.json(jsonbody);
	});
	if(req.body.due){
		var updateDue = request({
			uri: 'https://trello.com/1/cards/'+req.body.id+'/due?key='+req.body.key+'&token='+req.body.token,
			method: "PUT",
			form: {value: req.body.due}
			},function(error,response,body){
				var jsonbody=JSON.parse(body);
				res.json(jsonbody);
		});
	}
})

app.post("/createTimeline",function(req, res){
	//console.log(req.body);
	var createTimeline = request({
		uri: 'https://trello.com/1/cards/'+req.body.projectid+'/checklists?key='+req.body.key+'&token='+req.body.token,
		method: "POST",
		form: {name: "Project Timeline"}
		},function(error,response,body){
			var jsonbody=JSON.parse(body);
			res.json(jsonbody);
	})
});

app.listen(8081);