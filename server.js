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

/* registry of socket_ids and player info */
var players = [];

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){

		log('Client connection by '+socket.id);

	function log(){
		var array = [ '*** Server Log Message:    '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log', array);
		socket.broadcast.emit('log', array);
	}
		/* join room command*/
		/* payload:
			{ 'room' : 'sucess',
			'username' : username of person joining }
		join_room_response:
			{'result' : ' sucess',
			'room' : room joined,
			'username' :username that joined,
			'socket_od': the socket id of the person 
			'membership' : numer of ppl in the room including new person}
			or
			{result : fail,
			message : failure message} */

	socket.on('join_room', function(payload){
		log('\'join_room\' command '+JSON.stringify(payload));

		/* check that a client sent a payload */
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response' ,   {
								result: 'fail',
								message: error_message
								});
			return;
			} 
			/* check that the payload has a room to join */
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
		/* check that a user name has been provided */


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
		/* store info about new player */
		players[socket.id] = {};
		players[socket.id].username = username;
		players[socket.id].room = room;

		/* actually have the user join the room */
		socket.join(room);


		/* get ther oom object */
		var roomObject = io.sockets.adapter.rooms[room]; 

		/* tell everyone that is already in the room that someone joined */
		var numClients = roomObject.length;
		var success_data = {
						result: 'success',
						room: room,
						username: username,
						socket_id: socket.id,
						membership: (numClients + 1)
						};
		io.in(room).emit('join_room_response', success_data);

		for(var socket_in_room in roomObject.sockets){
			var success_data = {
						result: 'success',
						room: room,
						username: players[socket_in_room].username,
						socket_id: socket_in_room,
						membership: numClients,
					};
			socket.emit('join_room_response', success_data);
		}

		log('join_room success');

		if(room !== 'lobby'){
			send_game_update(socket,room,'initial update');
		}
	});


	socket.on('disconnect', function(socket){
		log('Client  disconnected  '+JSON.stringify(players[socket.id]));

		if('undefined'  !== typeof players[socket.id] && players[socket.id]){
			var username = players[socket.id].username;
			var room = players[socket.id].room;
			var payload = {
							username: username,
							socket_id: socket.id,
							};
			delete players[socket.id];
			io.in(room).emit('player_disconnected', payload);
		}
	});
		/* send message command*/
		/* payload:
			{ 'room' : room to join,
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
		
		var username = players[socket.id].username; 
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


		/* invite command*/
		/* payload:
			{ 'requested_user' : socket id of the person to be invited,
			}
		invite_response:
			{'result' : ' sucess',
			'socket_id' : the socket id of the person being invited,
			}
		or
			{result : fail,
			message : failure message}
		invited:
			{'result' : ' sucess',
			'socket_id' : the socket id of the person being invited,
			}
		or
			{result : fail,
			message : failure message}
		*/

	socket.on('invite', function(payload){
		log('Invite with'+JSON.stringify(payload));
		/* check to see if a payload was sent*/
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'invite had no payload, command aborted';
			log(error_message);
			socket.emit('invite_response' ,   {
									result: 'fail',
									message: error_message
									});
			return;
		} 
		/* check that the message can be traced to a username*/		
		var username = players[socket.id].username; 
		if (('undefined' === typeof username) || !username){
			var error_message = 'invite cant identify who sent the message, command aborted';
			log(error_message);
			socket.emit('invite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var requested_user = payload.requested_user; 
		if (('undefined' === typeof requested_user) || !requested_user){
			var error_message = 'invite did not specify a requested_user, command aborted';
			log(error_message);
			socket.emit('invite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
		/* make sure the user being invited is in the room */
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'invite requested a user that wasnt in the room, command aborted';
			log(error_message);
			socket.emit('invite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		}
		/* if everything is ok, respond to the inviter that it was a success*/
		var success_data = {
							result: 'success',
							socket_id: requested_user,
		};
		socket.emit('invite_response', success_data);

		/* tell the invited that they have been invited */
		var success_data = {
			result: 'success',
			socket_id: socket.id,
		};
		socket.to(requested_user).emit ('invited', success_data);

		log('invite successful');
	});

		/* uninvite command*/
		/* payload:
			{ 'requested_user' : socket id of the person to be uninvited,
			}
		uninvite_response:
			{'result' : ' sucess',
			'socket_id' : the socket id of the person being uninvited,
			}
		or
			{result : fail,
			message : failure message}
		uninvited:
			{'result' : ' sucess',
			'socket_id' : the socket id of the person doing the uninvited,
			}
		or
			{result : fail,
			message : failure message}
		*/

	socket.on('uninvite', function(payload){
		log('uninvite with'+JSON.stringify(payload));
		/* check to see if a payload was sent*/
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'uninvite had no payload, command aborted';
			log(error_message);
			socket.emit('uninvite_response' ,   {
									result: 'fail',
									message: error_message
									});
			return;
		} 
				/* check that the message can be traced to a username*/		
		var username = players[socket.id].username; 
		if (('undefined' === typeof username) || !username){
			var error_message = 'uninvite cant identify who sent the message, command aborted';
			log(error_message);
			socket.emit('uninvite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var requested_user = payload.requested_user; 
		if (('undefined' === typeof requested_user) || !requested_user){
			var error_message = 'uninvite did not specify a requested_user, command aborted';
			log(error_message);
			socket.emit('uninvite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		} 
		var room = players[socket.id].room;
		var roomObject = io.sockets.adapter.rooms[room];
			/* make sure the user being uninvited is in the room */
		if(!roomObject.sockets.hasOwnProperty(requested_user)){
			var error_message = 'uninvite requested a user that wasnt in the room, command aborted';
			log(error_message);
			socket.emit('uninvite_response',   {
								result: 'fail',
								message: error_message
								});
			return;
		}
			/* if everything is ok, respond to the uninviter that it was a success*/
		var success_data = {
							result: 'success',
							socket_id: requested_user,
		};
		socket.emit('uninvite_response', success_data);
	
			/* tell the invited that they have been uninvited */
		var success_data = {
			result: 'success',
			socket_id: socket.id,
		};
		socket.to(requested_user).emit ('uninvited', success_data);

		log('uninvite successful');
		});
	/* game_start command*/
			/* payload:
				{ 'requested_user' : socket id of the person to be uninvited,
				}
			game_start_response:
				{'result' : ' sucess',
				'socket_id' : the socket id of the person being you are playing with ,
				game_id: id of the game sesson 
				}
			or
				{result : fail,
				message : failure message}
			*/

	socket.on('game_start', function(payload){
		log('game_start with'+JSON.stringify(payload));
		/* check to see if a payload was sent*/
		if (('undefined' === typeof payload) || !payload){
			var error_message = 'game_start had no payload, command aborted';
			log(error_message);
			socket.emit('game_start_response' ,   {
									result: 'fail',
									message: error_message
									});
			return;
		} 
					/* check that the message can be traced to a username*/		
		var username = players[socket.id].username; 
			if (('undefined' === typeof username) || !username){
				var error_message = 'game_start cant identify who sent the message, command aborted';
				log(error_message);
				socket.emit('game_start_response',   {
									result: 'fail',
									message: error_message
									});
				return;
			} 
			var requested_user = payload.requested_user; 
			if (('undefined' === typeof requested_user) || !requested_user){
				var error_message = 'game_start did not specify a requested_user, command aborted';
				log(error_message);
				socket.emit('game_start_response',   {
									result: 'fail',
									message: error_message
									});
				return;
			} 
			var room = players[socket.id].room;
			var roomObject = io.sockets.adapter.rooms[room];
				/* make sure the user being uninvited is in the room */
			if(!roomObject.sockets.hasOwnProperty(requested_user)){
				var error_message = 'game_start requested a user that wasnt in the room, command aborted';
				log(error_message);
				socket.emit('game_start_response',   {
									result: 'fail',
									message: error_message
									});
				return;
			}
				/* if everything is ok, respond to the game starter that it was a success*/
				var game_id = Math.floor((1+Math.random()) *0x1000 ).toString(16).substring(1);
				var success_data = {
								result: 'success',
								socket_id: requested_user,
								game_id: game_id
			};
			socket.emit('game_start_response', success_data);
		
				/* tell the other player to play  */
			var success_data = {
				result: 'success',
				socket_id: socket.id,
				game_id: game_id
			};
			socket.to(requested_user).emit ('game_start_response', success_data);
	
			log('game_start successful');
			});					

/* play_token command */

socket.on('play_token', function(payload){
    log('play_token with '+JSON.stringify(payload));
    
    /*check that payload was sent */
    if(('undefined' === typeof payload) || !payload){
        var error_message = 'play_token had no payload, fail';
        log(error_message);
        socket.emit('play_token_response', {
            Result: 'fail',
            message: error_message
        });
        return;
    }


    /* check that the player has been previously registered */
    var player = players[socket.id];
    if(('undefined' === typeof player) || !player){
       var error_message = 'server does not know who you are (try going back one screen)';
       log(error_message);
       socket.emit('play_token_response ', {
          					result: 'fail',
          					message: error_message
      						});
       return;
   }

    /* check that the username has been previously registered */
    var username = players[socket.id].username;
    if(('undefined' === typeof username) || !username){
       var error_message = 'play_token  can\'t ,identify who sent the message';
       log(error_message);
       socket.emit('play_token_response ', {
          				result: 'fail',
          				message: error_message
      					});
       return;
   }

   /* check that the player has been previously registered */
    var game_id = players[socket.id].room;
    if(('undefined' === typeof game_id) || !game_id){
       var error_message = 'play_token  can\'t ,find your game board ';
       log(error_message);
       socket.emit('play_token_response ', {
          				result: 'fail',
          				message: error_message
      					});
       return;
   }

   /* check that the row is there */
    var row = payload.row;
    if(('undefined' === typeof row) || row < 0 || row > 7){
       var error_message = 'play_token  can\'t , specifiy a valid row';
       log(error_message);
       socket.emit('play_token_response ', {
          				result: 'fail',
          				message: error_message
      					});
       return;
   }
   /* check the column*/
    var column = payload.column;
    if(('undefined' === typeof column) || column < 0 || column > 7){
       var error_message = 'play_token  can\'t , specifiy a valid row';
       log(error_message);
       socket.emit('play_token_response ', {
          				result: 'fail',
          				message: error_message
      					});
       return;
   }
   /* pick a color */
   var color = payload.color;
    if(('undefined' === typeof color) || !color || (color != 'orange' && color != 'purple')){
       var error_message = 'play_token  can\'t , specifiy a color';
       log(error_message);
       socket.emit('play_token_response ', {
          				result: 'fail',
          				message: error_message
      					});
       return;
   }


   /* find the game board */
   var game = games[game_id];
   if(('undefined' === typeof game) || !game){
     var error_message = 'play_token  can\'t , find your game board';
     log(error_message);
     socket.emit('play_token_response ', {
      				result: 'fail',
      				message: error_message
  					});
     return;
 }

	/* if the current attempt at playing a token is out of turn */
	if(color !== game.whose_turn){
	var error_message = 'play_token message played out of turn';
	log(error_message);
	socket.emit('play_token_response ', {
											Result: 'fail',
											message: error_message
											});
	return;

	}

	/* if the wrong socket is playing the wrong color */
	if( ((game.whose_turn === 'orange') && (game.player_orange.socket != socket.id)) ||
		((game.whose_turn === 'purple') && (game.player_purple.socket != socket.id))){ 
		var error_message = 'play_token  message played by wrong player';
		log(error_message);
		socket.emit('play_token_response ', {
											Result: 'fail',
											message: error_message
											});
	return;

	}


   var success_data = {
                    result: 'success'
                };

    socket.emit('play_token_response',success_data);

    /* execute the move */

    if(color == 'orange'){
		game.board[row][column] = 'o';
		flip_board('o',row,column,game.board);
		game.whose_turn = 'purple';
		game.legal_moves = calculate_valid_moves('p', game.board);
    }
 
    else if(color == 'purple'){
		game.board[row][column] = 'p';
		flip_board('p',row,column,game.board);
		game.whose_turn = 'orange';
		game.legal_moves = calculate_valid_moves('o', game.board);
    }

    var d = new Date();
    game.last_move_time = d.getTime();


    send_game_update(socket,game_id,'played the token');

    });



});


/*******************************************************************/
/* this is code for the game state */

var games = [];

function create_new_game(){
    var new_game = {};
    new_game.player_orange = {};
    new_game.player_purple = {};
    new_game.player_orange.socket = '';
    new_game.player_orange.username = '';
    new_game.player_purple.socket = '';
    new_game.player_purple.username = '';

    var d = new Date();
    new_game.last_move_time = d.getTime();

    new_game.whose_turn ='purple';

    new_game.board = [
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ','o','p',' ',' ',' '],
                        [' ',' ',' ','p','o',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' ']
                     ];
	new_game.legal_moves = calculate_valid_moves('p', new_game.board);
    return new_game;
}
/*checks if there is a color 'who' on the line starting at r/c or anythere by adding */

function check_line_match(who,dr,dc,r,c,board){

    if(board[r][c] === who){
        return true;
    }
     if(board[r][c] === ' '){
        return false;
    }


    if((r+dr < 0 ) || (r+dr > 7)){
        return false;
    }
    if((c+dc < 0 ) || (c+dc > 7)){
        return false;
    }
    return check_line_match(who,dr,dc,r+dr,c+dc,board);
}


/* valid move function check ending in the who color*/
function valid_move(who, dr, dc, r, c, board){
    var other;
    if(who === 'p'){
        other = 'o';
    }
    else if(who === 'o'){
        other = 'p';
    }
    else{
        log('Houston we have a color problem: '+who);
        return false;
    }

    if((r+dr < 0 ) || (r+dr > 7)){
        return false;
    }
    if((c+dc < 0 ) || (c+dc > 7)){
        return false;
    }
    if(board[r+dr][c+dc] != other){
        return false;
    }
     if((r+dr+dr < 0 ) || (r+dr+dr > 7)){
        return false;
    }
    if((c+dc+dc < 0 ) || (c+dc+dc > 7)){
        return false;
    }
    return check_line_match(who,dr,dc,r+dr+dr,c+dc+dc,board);
}

function calculate_valid_moves(who,board){
    var valid = [
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' '],
                        [' ',' ',' ',' ',' ',' ',' ',' ']
                     ];
    for(var row = 0; row < 8; row++){
        for(var column = 0; column < 8; column++){
            if(board[row][column] === ' '){
                nw = valid_move(who, -1, -1, row, column, board);
                nn = valid_move(who, -1, 0, row, column, board);
                ne = valid_move(who, -1, 1, row, column, board);

                ww = valid_move(who, 0, -1, row, column, board);
                ee = valid_move(who, 0, 1, row, column, board);

                sw = valid_move(who, 1, -1, row, column, board);
                ss = valid_move(who, 1, 0, row, column, board);
                se = valid_move(who, 1, 1, row, column, board);

                if(nw || nn || ne || ww || ee || sw || ss || se){
                    valid[row][column] = who;
                }
            }
        }
    }
    return valid;
}

function flip_line(who,dr,dc,r,c,board){
    if((r+dr < 0 ) || (r+dr > 7)){
        return false;
    }
    if((c+dc < 0 ) || (c+dc > 7)){
        return false;
    }
    if(board[r+dr][c+dc] === ' '){
        return false;
    }
    if(board[r+dr][c+dc] === who){
        return true;
    }
    else{
        if(flip_line(who,dr,dc,r+dr,c+dc,board)){
            board[r+dr][c+dc] = who;
            return true;
        }
        else{
            return false;
        }
    }
}

function flip_board(who,row,column,board){
    flip_line(who,-1,-1,row,column,board);
    flip_line(who, -1, -1, row, column, board);
    flip_line(who, -1, 0, row, column, board);
    flip_line(who, -1, 1, row, column, board);

    flip_line(who, 0, -1, row, column, board);
    flip_line(who, 0, 1, row, column, board);

    flip_line(who, 1, -1, row, column, board);
    flip_line(who, 1, 0, row, column, board);
    flip_line(who, 1, 1, row, column, board);

}


function send_game_update(socket, game_id, message){
	/* check to see if game with game_id exist */
        if(('undefined' === typeof games[game_id]) || !games[game_id]){
            /* no game exist, so make one */
            console.log('No game exist, creating '+game_id+' for '+socket.id);
            games[game_id] = create_new_game();
        }
    /*if someone is already in the room */
  
	var roomObject;
	var numClients;
    do{
        roomObject = io.sockets.adapter.rooms[game_id]; 
        numClients = roomObject.length;
        if(numClients > 2){
            console.log('Too many client in room: '+game_id+' #: '+numClients);
            if(games[game_id].player_orange.socket == roomObject.sockets[0]){
                games[game_id].player_orange.socket = '';
                games[game_id].player_orange.username = '';
            }
            if(games[game_id].player_purple.socket == roomObject.sockets[0]){
                games[game_id].player_purple.socket = '';
                games[game_id].player_purple.username = '';
			}
			/* kick out the first socket */
		
            var sacrifice = Object.keys(roomObject.sockets)[0];
            io.of('/').connected[sacrifice].leave(game_id);
        }
    }
    while((numClients-1) > 2);
	
    /*assign a socket a color*/
	/* if the current player isn't assigned a color */
	
    if((games[game_id].player_orange.socket != socket.id) && (games[game_id].player_purple.socket != socket.id)){
        console.log('Player is not assigned a color: '+socket.id);
		/* and there is not a color to give them */
		
        if((games[game_id].player_purple.socket != '') && (games[game_id].player_orange.socket != '')){
            games[game_id].player_orange.socket = '';
            games[game_id].player_orange.username = '';
            games[game_id].player_purple.socket = '';
            games[game_id].player_purple.username = '';
        }
    }

    /* assign colors to the player if not already done */
    if(games[game_id].player_orange.socket == ''){
        if(games[game_id].player_purple.socket != socket.id){
            games[game_id].player_orange.socket = socket.id;
            games[game_id].player_orange.username = players[socket.id].username;
        }
    }
    if(games[game_id].player_purple.socket == ''){
        if(games[game_id].player_orange.socket != socket.id){
            games[game_id].player_purple.socket = socket.id;
            games[game_id].player_purple.username = players[socket.id].username;
        }
    }


    
    /*send game update*/
    var success_data = {
       		 result: 'success',
       		 game: games[game_id],
      		  message: message,
       		 game_id: game_id
   		 };

    io.in(game_id).emit('game_update',success_data);
    
/*Check to see if the game is over */
var row,column;
var count = 0;
var purple = 0;
var orange = 0;
for(row = 0; row < 8; row++){
	for(column = 0; column < 8; column++){
		if(games[game_id].legal_moves[row][column] != ' '){
			count++;
		}
		if(games[game_id].board[row][column] === 'p'){
			purple++;
		}
		if(games[game_id].board[row][column] === 'o'){
			orange++;
		}
	}
}

if(count == 0){
	/* send a game over message */ 
	var winner = 'tie game';
	if(purple > orange){
		winner = 'purple';
	}
	if(orange > purple){
		winner = 'orange';
	}

	var success_data = {

					result: 'success',
					game: games[game_id],
					who_won: winner,
					game_id: game_id
				};
	io.in(game_id).emit('game_over', success_data);


		/*delete old games after an hour */
		setTimeout(function(id){
			return function(){
			delete games[id];
			}}(game_id),
			60*60*1000);
	}


}
	