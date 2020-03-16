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

/* connect to the socket server */
var chat_room = 'One_Room';

var socket = io.connect();

socket.on('log', function(array){
    console.log.apply(console, array);
});

socket.on('join_room_response' ,function(payload){
    if(payload.result == 'fail'){
        alert(payload.message);
        return;
    }
    $( '#messages' ).append('<h4>New User joined the chat :  '+payload.username+ '</h4>');
});

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


$(function(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;

    console.log(' * * * Client Log message: \'join_room\' payload:  ' +JSON.stringify(payload));
    socket.emit('join_room' ,payload);

});