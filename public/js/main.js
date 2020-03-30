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
        var buttonC = makeInviteButton();
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
        var buttonC = makeInviteButton();
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



    //$( '#messages' ).append('<h4>New User joined the chat :  '+payload.username+'</h4>');


socket.on('send_message_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    console.log(' *** check to see if this is showing up for \'send_message_response\' or not');
    $( '#messages' ).append('<p><b>'+payload.username+'    says:</b>  '+payload.message+'</p>');
});

function send_message(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;
    payload.message = $('#send_message_holder').val();
    console.log(' *** client log message: \'send_message\' payload:   '+JSON.stringify(payload));
    socket.emit('send_message', payload);
}

function makeInviteButton(){
    var newHTML = '<button type = \'button\' class=\'btn btn-outline-primary\'> Invite</button>';
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