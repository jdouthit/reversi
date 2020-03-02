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
