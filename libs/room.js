function Room(code){
	this.code = code;
	this.master = -1;
	this.people = [];
}

module.exports = Room;