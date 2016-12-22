var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var http = require("http").Server(app);
var io = require('socket.io')(http);

// Custom object
var Room = require('./libs/room.js');

// Connection URL for Mongo
var MongoURL = 'mongodb://localhost:27017/myproject';

// List to keep track of active rooms
var rooms = [];

var userId = 0;

//"public" folder is where express will grab static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

//Folder in which express will grab templates
//app.set('views', __dirname + '/views');

//Setting the view engine
app.set('view engine', 'ejs');

app.get('/', function(req, res){
	res.render('home');
});

app.get(/^.room-\w\w\w\w\w$/, function(req, res){
	code = req.originalUrl.substring(6, 11);
	/*
	MongoClient.connect(MongoURL, function(err, db){
		assert.equal(null, err);
		console.log("Connected successfully to server");
		findDocument(db, code, 
			// First callback if no error
			function(){
				db.close();
				res.render("room");
			},
			// Second callback if there is an error
			function(){
				db.close();
				res.status(404).send("Not found");
			});
	});
	*/

	// Iterate through the list of rooms to see if it exists
	for(var i = 0; i < rooms.length; i++){
		if(rooms[i].code === code){
			res.render("room");
			return;
		}
	}
	res.status(404).send("Room does not exist");
});

// Create a new room
app.post('/makeRoom', function(req, rs){
	var newCode = generateRoomCode();
	/*
	// Use connect method to connect to the server
	MongoClient.connect(MongoURL, function(err, db) {
		assert.equal(null, err);
		insertDocuments(db, newCode, function() {
			db.close();
		});
	rs.redirect('/room-' + newCode);
	});
	*/

	// Create a new room and add it to the "rooms" list
	rooms.push(new Room(newCode));

	rs.redirect('/room-' + newCode)
});

// Join a room
app.post('/joinRoom', function(req, rs){
	rs.redirect('/room-' + req.body.joinRoomName);
});

/*
	app.listen(3000, function(){
		console.log('Listening on port 3000');
	});
*/

function generateRoomCode(){
	var code = "";
	var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	for(var i = 0; i < 5; i++){
		code += charSet.charAt(Math.floor(Math.random() * charSet.length));
	}
	return code;
}

// Database stuff
var insertDocuments = function(db, code, callback) {
	// Get the documents collection
	var collection = db.collection('rooms');
	// Insert some documents
	collection.insertMany([{room : code}, {users : ["default"]}], function(err, result){
		assert.equal(err, null);
		callback(result);
	});
}

var findDocument = function(db, code, successCallback, errorCallback){
	// Get the documents collection
	var collection = db.collection('rooms');
	// Find some documents
	collection.find({"room" : code}).toArray(function(err, docs){
		if(docs.length != 0){
			successCallback();
		}
		else{
			errorCallback();
		}
	});
}

// Socket.io stuff
http.listen(3000, function(){
	console.log("listening on :3000");
});

io.on("connection", function(socket){

	var user;

	var roomIndex;
	
	// When the server is alerted of a new user's connection
	socket.on("new-user", function(data){

		user = {id : userId, name : data.user};
		userId++;

		// Broadcast to all clients that they must update their users list
		socket.join(data.code);

		// Retrieve the room in rooms list, then update its list of users

		for(var i = 0; i < rooms.length; i++){
			if(rooms[i].code === data.code){

				// If the room has no master, set as this user
				if(rooms[i].master === -1){
					rooms[i].master = user.id;
					user.name = "★ " + user.name
				}

				roomIndex = i;

				console.log(user);
				rooms[roomIndex].people.push(user);
				break;
			}
		}

		io.to(data.code).emit("update-users", rooms[roomIndex].people);
	});

	// When the server is alerted of a message being submitted
	socket.on("chat-submit", function(data){
		console.log("message: " + data.msg);

		var chatUsername = data.user;

		// Add a "★" next to the master's chat messages
		if(rooms[roomIndex].master === user.id){
			chatUsername = "★ " + data.user;
		}

		io.to(data.code).emit("update-messages", {user: chatUsername, msg: data.msg});
	});

	socket.on("disconnect", function(){

		// Delete disconnected user from "people" list
		if(user != null){
			for(var i = 0; i < rooms[roomIndex].people.length; i++){
				if(user.id === rooms[roomIndex].people[i].id){
					console.log(user.id + " has disconnected" + "(" + user.name + ")");
					rooms[roomIndex].people.splice(i, 1);

					// Set a new room master
					if(rooms[roomIndex].people[0] != null){
						if(rooms[roomIndex].people[0].id != rooms[roomIndex].master){
							rooms[roomIndex].master = rooms[roomIndex].people[0].id;
							rooms[roomIndex].people[0].name = "★ " + rooms[roomIndex].people[0].name;
						}
					}
					else{
						rooms[roomIndex].master = -1;
					}

					console.log(rooms[roomIndex].people);
					io.to(rooms[roomIndex].code).emit("update-users", rooms[roomIndex].people);
				}
			}
		}
	});
});

/*
	
	potential bugs:
	- two rooms generating the same 5-digit code

*/
