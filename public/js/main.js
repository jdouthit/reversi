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

$( '#messages').append('<h4>'+username+'</h4>');
