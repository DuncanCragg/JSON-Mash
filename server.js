#!/usr/bin/env node

var sys  = require('sys');
var fs   = require('fs');
var url  = require('url');
var path = require('path');
var http = require('http');

var fjord = require('./www/js/json-mash-fjord');

var persistenceReady = function(){
    sys.puts("ready");
}

fjord.init({ "dbFileName": "./site/content.db",
             "dbLoaded": persistenceReady,
             "nexusPort": -1,
             "logNetworking": 1
});

var logNetworking = true;

//-----------------------------------------------

Server = {

init: function(port){

    http.createServer(this.requestToHandleInAClumsyWay).listen(port);
    sys.puts("Server listening on "+port);
},

requestToHandleInAClumsyWay: function(request, response){

    if(logNetworking) sys.puts("----> Request --------------------------");
    if(logNetworking) sys.puts("method="+request.method);
    if(logNetworking) sys.puts("clumsy path="+JSON.stringify(request.url));
    if(logNetworking) sys.puts("headers="+JSON.stringify(request.headers));
    if(logNetworking) sys.puts("----------------------------------------");

    if(request.method!="GET") return;

    var uri = "/site"+url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);

    path.exists(filename, function(exists){
        if(!exists){
            response.sendHeader(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            if(logNetworking) sys.puts("404 Not Found\n");
            response.end();
            return;
        }
        fs.readFile(filename, "binary", function(err, file){
            if(err){
                response.sendHeader(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                if(logNetworking) sys.puts("500 Server Error\n"+err);
                response.end();
                return;
            }
            response.sendHeader(200, {"Content-Type": mimeTypeFor(filename)});
            response.write(file, "binary");
            if(logNetworking) sys.puts("200 OK\n");
            response.end();
        });
    });
}

}

Server.init(8880);

//-----------------------------------------------

function mimeTypeFor(filename){
    if(/\.js$/  .test(filename)) return "application/javascript";
    if(/\.json$/.test(filename)) return "application/json";
    if(/\.css$/ .test(filename)) return "text/css";
    if(/\.gif$/ .test(filename)) return "image/gif";
    if(/\.png$/ .test(filename)) return "image/png";
    if(/\.jpg$/ .test(filename)) return "image/jpeg";
    if(/\.jpeg$/.test(filename)) return "image/jpeg";
    if(/\.htm$/ .test(filename)) return "text/html";
    if(/\.html$/.test(filename)) return "text/html";
    return "text/plain";
}

//-----------------------------------------------
/*
Micro( 
{ "headers": {
  "UID": "c6b0ed28-b4cd04e8-adfb3a48",
  "pubs": [ "/users/u/c6b0ed28-b4cd04e8-adfb3a48.u" ],
  "subs": [ ],
  "perm": "*"
  },
  "content": {
    "user": {
       "name": "",
       "saying": "",
       "applying": [ ],
       "viewing": [ ]
    }
  }
}
) 
*/

