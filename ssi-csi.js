#!/usr/bin/env node

var sys  = require('sys');
var fs   = require('fs');
var url  = require('url');
var path = require('path');
var http = require('http');

var fjord = require('../fjord/fjord');
var Cache = fjord.Cache;

var JSON2HTML = require('./js/json-mash-html').JSON2HTML;

var persistenceReady = function(){
    sys.puts("ready");
}

fjord.init({ "dbFileName": "./content.db",
             "dbLoaded": persistenceReady,
             "nexusPort": -1,
             "logNetworking": 1
});

var logNetworking = true;

//-----------------------------------------------

SSIServer = {

init: function(port){

    http.createServer(this.newRequest).listen(port);
    sys.puts("SSI Server listening on "+port);
},

newRequest: function(request, response){

    if(logNetworking) sys.puts("----> Request --------------------------");
    if(logNetworking) sys.puts("method="+request.method);
    if(logNetworking) sys.puts("path="+JSON.stringify(request.url));
    if(logNetworking) sys.puts("headers="+JSON.stringify(request.headers));
    if(logNetworking) sys.puts("----------------------------------------");

    if(request.method=="GET") SSIServer.doGET(request, response);
    else
    if(request.method=="POST") SSIServer.doPOST(request, response);
},

doGET: function(request, response){

    var owid = this.extractOWID(request.url);

    if(!owid) this.fileGET(request, response);
    else      this.ssiGET(request, response, owid);
},

ssiGET: function(request, response, owid){

    var o = Cache.pull(owid, null);
    this.insertInto("ssi.html", "body", JSON2HTML.render(o), function(err, html){

    var headers = { "Content-Type": "text/html", };
    response.sendHeader(200, headers);
    response.write(html);
    if(logNetworking) sys.puts("200 OK; "+html.length+"\n"+JSON.stringify(headers)+'\n'+html);
    response.close();
    if(logNetworking) sys.puts("<---------------------------------------");
    });
},

fileGET: function(request, response){
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    path.exists(filename, function(exists){
        if(!exists){
            response.sendHeader(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            if(logNetworking) sys.puts("404 Not Found\n");
            response.close();
            return;
        }
        fs.readFile(filename, "binary", function(err, file){
            if(err){
                response.sendHeader(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                if(logNetworking) sys.puts("500 Server Error\n"+err);
                response.close();
                return;
            }
            response.sendHeader(200);
            response.write(file, "binary");
            if(logNetworking) sys.puts("200 OK\n");
            response.close();
        });
    });
},

doPOST: function(request, response){
},

//-----------------------------------------------

extractOWID: function(url){
    if(!url) return null;
    var a = url.match(/(owid-[-0-9a-z]+)\.html$/);
    return (a && a[1])? a[1]: null;
},

insertInto: function(filename, tag, content, cb){
    fs.readFile(filename, function(err, file){
        file=file.replace("{"+tag+"}", content);
        cb(err, file);
    });
},

//-----------------------------------------------

}

SSIServer.init(8880);

//-----------------------------------------------

