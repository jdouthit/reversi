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
}
socket.on('send_message_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    var newHTML= '<p><b>'+payload.username+'    says:</b>  '+payload.message+'</p>';
    var newNode = $(newNode);
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

});