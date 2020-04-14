/* functions for general use */

/* func returns value associated with which param on url*/

function getURLParams(whichParam)
{
    var pageURL = window.location.search.substring(1);
    var pageURLVars = pageURL.split('&');
    for (var i = 0; i < pageURLVars.length; i++){
        var paramName = pageURLVars[i].split('=');
        if (paramName[0] == whichParam){
            return paramName[1];
        }
    }
}

var username = getURLParams('username');
if('undefined' == typeof username || !username){
    username = 'Anonymous_'+Math.random();
}
var chat_room = getURLParams('game_id');
if ('undefined' == typeof chat_room || !chat_room){
    chat_room = 'lobby';
}
/* connect to the socket server */
var socket = io.connect();
/* wha to do when the server sends me a log message */
socket.on('log', function(array){
    console.log.apply(console, array);
});
/* what to do when the server responds that someone joined the room */
socket.on('join_room_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    /* if we are being notified that we joined the room, then ignore it*/
    if (payload.socket_id == socket.id){
        return;
    }

    /* if someone joined then add a new row to the lobby table */
    var dom_elements = $('.socket_'+payload.socket_id);
    /* if we dont already have an entry for this person */
    if(dom_elements.length == 0){
        var nodeA = $('<div></div>');
        nodeA.addClass('socket_'+payload.socket_id);

        var nodeB = $('<div></div>');
        nodeB.addClass('socket_'+payload.socket_id);

        var nodeC = $('<div></div>');
        nodeC.addClass('socket_'+payload.socket_id);

        nodeA.addClass('w-100');

        nodeB.addClass('col-9 text-right');
        nodeB.append('<h4>'+payload.username+'</h4>');

        nodeC.addClass('col-3 text-left');
        var buttonC = makeInviteButton(payload.socket_id);
        nodeC.append(buttonC);

        nodeA.hide();
        nodeB.hide();
        nodeC.hide();
        $('#players').append(nodeA,nodeB,nodeC);
        nodeA.slideDown(1000);
        nodeB.slideDown(1000);
        nodeC.slideDown(1000);


    }
    else{
        uninvite(payload.socket_id);
        var buttonC = makeInviteButton(payload.socket_id);
        $('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
        dom_elements.slideDown(1000);
    }

/* manage the message that a new player has left*/
    var newHTML = '<p>'+payload.username+' just entered the lobby</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').append(newNode);
    newNode.slideDown(1000);
});



/* what to do when the server says that someone left the room */
socket.on('player_disconnected' ,function(payload){
    if(payload.result =='fail'){
        alert(payload.message);
        return;
    }
    /* if we are being notified that we left the room, then ignore it*/
    if (payload.socket_id == socket.id){
        return;
    }

    /* if someone left the room then animate out all the content */
    var dom_elements = $('.socket_'+payload.socket_id);

    /* if something exists */
    if(dom_elements.length != 0){
        dom_elements.slideUp(1000);
    }

/* manage the message that a  player has left*/
    var newHTML = '<p>'+payload.username+' player has left the lobby</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').append(newNode);
    newNode.slideDown(1000);
});

//send invite message to server
function invite(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log message: \'invite\' payload: '+JSON.stringify(payload));
    socket.emit('invite', payload);
}


socket.on('invite_response' ,function(payload){
    console.log('received invite response')
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInvitedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makePlayButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});



//send an uninvite message to the server
function uninvite(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log message: \'uninvite\' payload: '+JSON.stringify(payload));
    socket.emit('uninvite', payload);
}

//handle rsponse after sending uninvite message to server
socket.on('uninvite_response' ,function(payload){
    console.log('received invite response')
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});
//handle notification that we have been uninvited
socket.on('uninvited' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});
    //$( '#messages' ).append('<h4>New User joined the chat :  '+payload.username+'</h4>');

    //send an game_start message to the server
function game_start(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log message: \'game_start\' payload: '+JSON.stringify(payload));
    socket.emit('game_start', payload);
}


//handle notification that we have been engaged in starting
socket.on('game_start_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newNode = makeEngagedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);

    //jump to a new page
    window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});
 




function send_message(){
    var payload = {};
    payload.room = chat_room;
    payload.message = $('#send_message_holder').val();
    console.log(' *** client log message: \'send_message\' payload:   '+JSON.stringify(payload));
    socket.emit('send_message', payload);
    $('#send_message_holder').val('');
    console.log('hello?');
}
socket.on('send_message_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        console.log('is this thing on');
        return;
    }
    var newHTML= '<p><b>'+payload.username+'    says:</b>  '+payload.message+'</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $( '#messages' ).append(newNode);
    newNode.slideDown(1000);
});

function makeInviteButton(socket_id){
    var newHTML = '<button type = \'button\' class=\'btn btn-outline-primary\'> Invite</button>';
    var newNode = $ (newHTML);
    newNode.click(function(){
        invite(socket_id);
    });
    return(newNode);
}

function makeInvitedButton(socket_id){
    var newHTML = '<button type = \'button\' class=\'btn btn-primary\'> Invited</button>';
    var newNode = $ (newHTML);
    newNode.click(function(){
        uninvite(socket_id);
    });
    return(newNode);
}

function makePlayButton(socket_id){
    var newHTML = '<button type = \'button\' class=\'btn btn-success\'>Play</button>';
    var newNode = $ (newHTML);
    newNode.click(function(){
        game_start(socket_id);
    });
    return(newNode);
}
function makeEngagedButton(){
    var newHTML = '<button type = \'button\' class=\'btn btn-danger\'> Engaged</button>';
    var newNode = $ (newHTML);
    return(newNode);
}

$(function(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;

    console.log(' * * * Client Log message: \'join_room\' payload:  ' +JSON.stringify(payload));
    socket.emit('join_room' ,payload);

    $('#quit').append('<a href="lobby.html?username='+username+' " class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');
    

});


var old_board = [
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ],
    ['?','?','?','?','?','?','?','?' ]
    ];

var my_color = ' ';
    
socket.on('game_update',function(payload){
	console.log('*** client log message: \'game_update\'\n\t payload: '+JSON.stringify(payload));
	/* check for a good board update */
	if(payload.result == 'fail'){
		console.log(payload.message);
		window.location.href = 'lobby.html?username='+username;
		return;
	}
	/* check for a good board in the payload */
	var board = payload.game.board;
	if('undefined' == typeof board || !board){
		console.log('Interal error, recieved a malformed board update from the server');
		return;
    }
    /*update my color*/
	if(socket.id == payload.game.player_white.socket){
		my_color = 'white';
	}
	else if(socket.id == payload.game.player_black.socket){
		my_color = 'black';
	}
	else{
		/* something weird is going on */
		window.location.href = 'lobby.html?username='+username;
		return;
	}

	$('#my_color').html('<h3 id="my_color">I am '+my_color+'</h3>');
	$('#my_color').append('<h4>It is '+payload.game.whose_turn+'\'s turn. <h4>');


    /* animate changes to the board */

    var blacksum = 0;
	var whitesum = 0;
	var row,column;
	for(row = 0; row < 8; row++){
			if(board[row][column] == 'b'){
				blacksum++;
			}
			if(board[row][column] =='w'){
				whitesum++;
            } 

		for(column = 0; column < 8; column++){
			if(old_board[row][column] != board[row][column]){
				if(old_board[row][column] == '?' && board[row][column] == ' '){
					$('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
				}
				else if(old_board[row][column] == '?' && board[row][column] == 'w'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white sqaure"/>');
				}
				else if(old_board[row][column] == '?' && board[row][column] == 'b'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black sqaure"/>');
				}	
				else if(old_board[row][column] == ' ' && board[row][column] == 'w'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white sqaure"/>');
				}
				else if(old_board[row][column] == ' ' && board[row][column] == 'b'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black sqaure"/>');
				}	
				else if(old_board[row][column] == 'w' && board[row][column] == ' '){
					$('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="empty sqaure"/>');
				}
				else if(old_board[row][column] == 'b' && board[row][column] == ' '){
					$('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="empty sqaure"/>');
				}	
				else if(old_board[row][column] == 'w' && board[row][column] == 'b'){
					$('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="black sqaure"/>');
				}
				else if(old_board[row][column] == 'b' && board[row][column] == 'w'){
					$('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="white sqaure"/>');
				}
				else {
                    $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error/>');
                }
                /* set up interactivity */
			$('#'+row+'_'+column).off('click');
			if(board[row][column] == ' '){
					$('#'+row+'_'+column).addClass('hovered_over');
					$('#'+row+'_'+column).click(function(r,c){
						return function(){
							var payload = {};
							payload.row = r;
							payload.column = c;
							payload.color = my_color;
							console.log('*** client Log message: \'play_token\' payload: '+JSON.stringify(payload));
							socket.emit('play_token',payload);
						};
                    }(row,column));
                }
                else{
                    $('#'+row+'_'+column).removeClass('hovered_over');
                }
             }
       }    
    }

    $('#blacksum').html(blacksum);
    $('#whitesum').html(whitesum); 

    old_board = board;

});

socket.on('play_token_response',function(payload){

	console.log('*** client log message: \'play_token_response\'\n\t payload: '+JSON.stringify(payload));
	/* check for a good play_token_reponse update */
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}

});

socket.on('game_over',function(payload){

	console.log('*** client log message: \'game_over\'\n\t payload: '+JSON.stringify(payload));
	/* check for a good game_over update */
	if(payload.result == 'fail'){
		console.log(payload.message);
		return;
	}
	/* if the game is over we are going to jump to a new page */

	$('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+' won!<h/2>');
	$('#game_over').append('<a href="lobby.html?username='+username+' " class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the Lobby</a>');

});

