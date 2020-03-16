/******************************************************/
/******************************************************/

/* set up the static file server  */
/* include the static file webserver library */
var static = require('node-static');

/* include the hhtp server library */
var http = require('http');

/* assume we are running on heroku */
var port = process.env.PORT;
var directory = __dirname + '/public' ;

/* if we arent on heroku, need to readjust the port and directory info cause the port wont work */
if(typeof port == 'undefined' || !port){
	directory = './public';
	port = 8080;
}

/* set up a static web-server  that will deliver files from the filesystem */
var file = new static.Server(directory);


/* construct an http that gets files from the file server */
var app = http.createServer( 
	function(request,response){
		request.addListener('end',
			function(){
				file.serve(request,response);
			}	
		).resume();
	} 
  ).listen(port);
console.log('the server is running');
/******************************************************/
/*  set up the web socket server  */

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){

	function log(){
		var array = [ '*** Server Log Message:    '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log', array);
		socket.broadcast.emit('log', array);
	}
	log('A website connected to the server');

	socket.on('disconnect', function(socket){
		log('A website disconnected to the server');
	});
		/* join room command*/
		/* payload:
			{ 'room' : 'sucess',
			'username' : username of person joining }
		join_room_response:
			{'result' : ' sucess',
			'room' : room joined,
			'username' :username that joined,
			'membership' : numer of ppl in the room including new person}
			or
			{result : fail,
			message : failure message} */

	socket.on('join_room', function(payload){
		log('Server received a command', 'join_room', payload);
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response' ,   {
								result: 'fail',
								message: error_message
								});
			return;
			} 

		var room = payload.room; 
		if (('undefined' === typeof room) || !room){
			var error_message = 'join_room did not specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
								result: 'fail',
								message: error_message
									});
			return;
		} 

		var username = payload.username; 
		if (('undefined' === typeof username) || !username){
			var error_message = 'join_room did not specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 

		socket.join(room);

		var roomObject = io.sockets.adapter.rooms[room]; 
		if (('undefined' === typeof roomObject) || !roomObject){
			var error_message = 'join_room could not create a room (internal error), command aborted';
			log(error_message);
			socket.emit('join_room_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var numClients = roomObject.length;
		var success_data = {
						result: 'success',
						room: room,
						username: username,
						membership: (numClients + 1)
						};
		io.sockets.in(room).emit('join_room_response', success_data);
		log('Room  '+ room + '  was just joined by  '+ username);
	});
		/* send message command*/
		/* payload:
			{ 'room' : room to join,
			'username' : username of person sending the message
			'message' : the message sent }
		send_msg_response:
			{'result' : ' sucess',
			'username' :username of the person that spoke,
			'message' : message sent}
			or
			{result : fail,
			message : failure message} */
	socket.on('send_message', function(payload){
		log('Server received a command', 'send_message', payload);
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'send_message had no payload, command aborted';
			log(error_message);
			socket.emit('send_message_response' ,   {
									result: 'fail',
									message: error_message
									});
			return;
		} 
		
		var room = payload.room; 
		if (('undefined' === typeof room) || !room){
			var error_message = 'send_message did not specify a room, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
								result: 'fail',
								message: error_message
									});
			return;
		} 
		
		var username = payload.username; 
		if (('undefined' === typeof username) || !username){
			var error_message = 'send_message did not specify a username, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var message = payload.message; 
		if (('undefined' === typeof message) || !message){
			var error_message = 'send_message did not specify a message, command aborted';
			log(error_message);
			socket.emit('send_message_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var success_data = {
							result: 'success',
							room: room,
							username: username,
							message: message
		};
		io.in(room).emit('send_message_response', success_data);
		log('Message sent to room  ' +room  +'  by  ' + username);
	});
		
});