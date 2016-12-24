function Room(code){
	this.code = code;
	this.master = -1;
	this.people = [];
	this.currentVideo = "";
}

module.exports = Room;