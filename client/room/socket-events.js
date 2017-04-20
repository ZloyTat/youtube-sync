var modal = document.getElementById("nameModal");
var notificationSfx = new Audio('sfx/blop-sfx.mp3');

var inputtedName;
// Initial prompt for a new user asking for their name
$('#name-submit').submit(function(){

    // Close the modal after they have submitted a name
    modal.style.display = "none";


    // Grab the string from the input field
    inputtedName = $("#name-input").val();

    socket.emit("new-user", {user : inputtedName, code : roomCode});
    return false;
});

// Sending a client-side message
$('#chat-submit').submit(function(){

    var message = $("#chat-input").val();

    // Prevent entering blank messages
    if(message.length > 0){
        socket.emit("chat-submit", {msg : message, code : roomCode, user : inputtedName});
        $('#chat-input').val("");
    }

    return false;
});

// Submitting a YouTube link
$('#link-submit-form').submit(function(){

    var videoId = $('#link-input-box').val().slice(-11);

    socket.emit("change-video", videoId);

    $('#link-input-box').val("");
    return false;
})


// Receiving a new message
socket.on("update-messages", function(data){
    if(data.user.substring(0,1) === "★")
        $("#messages").append($('<div class="chat-message master">').html("<strong>" + data.user + ": </strong> " + data.msg));
    else
    $("#messages").append($('<div class="chat-message">').html("<strong>" + data.user + ": </strong> " + data.msg));
    notificationSfx.play();

    // Keep div scrolled to the bottom
    $("#chat-body").scrollTop($("#chat-body")[0].scrollHeight);
});

// Receiving an alert of a new connection
socket.on("update-users", function(people){
    $("#user-list").html('');
    for(var i = 0; i < people.length; i++){
        $("#user-list").append($('<div class="online-users">').text(people[i].name));
    }
    // User count update
    if(people.length == 1){
        $('#users-list-header').text(people.length + " user");
    }
    else{
        $('#users-list-header').text(people.length + " users");
    }
});

// Receiving an alert of someone connecting
socket.on("connection-message", function(name){
    $("#messages").append($('<div class="chat-message leaver">').html("<strong>" + name + " has joined the room</strong>"));
})

// Receiving an alert of someone disconnecting
socket.on("disconnection-message", function(name){
    $("#messages").append($('<div class="chat-message leaver">').html("<strong>" + name + " has left the room</strong>"));
});


// Pause the video when someone else in the room pauses
socket.on("set-player-state-paused", function(){
    if(player.getPlayerState() != 2)
        player.pauseVideo();
});

// Play the video when someone else in the room plays
socket.on("set-player-state-play", function(){
    if(player.getPlayerState() != 1)
        player.playVideo();
});

// Update the video if it changes
socket.on("update-video", function(data){
    player.cueVideoById(data.videoId, data.currentTime);
});

// Update the video's time when someone seeks
socket.on("update-currentTime", function(time){
    player.seekTo(time, true);
})