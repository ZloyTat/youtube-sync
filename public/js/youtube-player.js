// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementById('youtube-embed');
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    
    player = new YT.Player('player', {
        height: '315',
        width: '560',
        videoId: 'blankVideo',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

}

function onPlayerReady(event) {
    // Sets the video
    socket.emit("set-video");
    var previousTime = -1;
    var interval = 1000;

    // This function detects any "seek" events, then informs the server if it does happen
    var checkTime = function(){
        var currentTime = player.getCurrentTime();

        if(previousTime > -1){
            if(Math.abs(currentTime - previousTime) > 2){
                socket.emit("seek-video", currentTime);
            }
        }
        previousTime = player.getCurrentTime();

        // Updates the room's video time, so new clients joining the room will start at the correct time
        socket.emit("update-room-time", currentTime);

        if($('#video-title').html() != player.getVideoData().title){
            $('#video-title').text(player.getVideoData().title);
        }
        
        setTimeout(checkTime, interval);
    }

    checkTime();
}
//    The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
    switch(event.data){
        case YT.PlayerState.PAUSED:
            socket.emit("pause-player")
            break;
        case YT.PlayerState.PLAYING:
            socket.emit("play-player");
            break;
    }
}
function stopVideo() {
    player.stopVideo();
}