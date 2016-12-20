var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var http = require("http").Server(app);
var io = require('socket.io')(http);

// Connection URL for Mongo
var MongoURL = 'mongodb://localhost:27017/myproject';

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
	console.log(req.originalUrl.substring(6,11));
	code = req.originalUrl.substring(6, 11);
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
});

// Create a new room
app.post('/makeRoom', function(req, rs){
	var newCode = generateRoomCode();
	// Use connect method to connect to the server
	MongoClient.connect(MongoURL, function(err, db) {
		assert.equal(null, err);
		insertDocuments(db, newCode, function() {
			db.close();
		});
	rs.redirect('/room-' + newCode);
	});
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
	collection.insertMany([{room : code}], function(err, result) {
		assert.equal(err, null);
		assert.equal(1, result.ops.length);
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
	console.log("A user connected");
	socket.on("new-user", function(user){
		console.log("New user: " + user);
		io.emit("add-user", user)
	});
	socket.on("chat-submit", function(msg){
		console.log("message: " + msg);
		io.emit("new-message", msg);
	});
	socket.on("disconnect", function(){
		console.log("A user disconnected");
	});
});