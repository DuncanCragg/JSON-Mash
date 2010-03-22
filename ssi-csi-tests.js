#!/usr/bin/env node

var sys = require('sys');
var http = require('http');

var test = require('../fjord/simple-test');

var fjord = require('../fjord/fjord');
var log       = fjord.log;
var WebObject = fjord.WebObject;
var Cache     = fjord.Cache;


fjord.init({ "thisPort": 8081 });

sys.puts('------------------ Fjord Networking Tests ---------------------');

WebObject.logUpdates=false;

// -------------------------------------------------------------------

var client = http.createClient(8080, "localhost");

var headers = { "Host": "localhost:8080" };

var r=client.request("GET", "/a/b/c/owid-73c2-4046-fe02-7312.json", headers);

r.addListener("response", function(response){

// -------------------------------------------------------------------

var statusCode = response.statusCode;
test.isEqual("Status is 200", 200, statusCode);

var owid = response.headers["content-location"].match(/(owid-[-0-9a-z]+)\.json$/)[1];
test.isEqual("OWID is correct in Content-Location", "owid-73c2-4046-fe02-7312", owid);

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", 1, etag);

var cacheNotify = response.headers["cache-notify"];
test.isEqual("Cache-Notify is http://localhost:8080/fjord/cache-notify",
             "http://localhost:8080/fjord/cache-notify", cacheNotify);

// -------------------------------------------------------------------

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){
test.isEqual("Test Server returned expected JSON content",
             JSON.parse(body), {"tags":["x","y"]}
);

// -------------------------------------------------------------------

var r=client.request("GET", "/u/owid-73c2-4046-fe02-7312.js", headers);

r.addListener("response", function(response){

// -------------------------------------------------------------------

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/javascript", "application/javascript", contentType);

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){
test.isEqual("Test Server returned expected Javascript content",
 body,
"O(\n{\"owid\":\"owid-73c2-4046-fe02-7312\",\"refs\":{},\"outlinks\":{},\"etag\":1,\"content\":{\"tags\":[\"x\",\"y\"]}}\n);\n"
);

// -------------------------------------------------------------------

var client = http.createClient(8880, "localhost");

var headers = { "Host": "localhost:8880" };

var r=client.request("GET", "/a/b/c/owid-73c2-4046-fe02-7312.html", headers);

r.addListener("response", function(response){

// -------------------------------------------------------------------

var statusCode = response.statusCode;
test.isEqual("Status is 200", 200, statusCode);

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){
test.isEqual("Test Server returned expected HTML content",
             body,
             "<!DOCTYPE html PUBLIC \\\"-//W3C//DTD XHTML 1.0 Strict//EN\\\" \\\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\\\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\" >\n<head><meta http-equiv=\"Content-Type\" content=\"application/xhtml+xml; charset=UTF-8\"/>\n</head>\n<body>\n{\"tags\":[\"x\",\"y\"]}\n</body>\n</html>\n"
);

// -------------------------------------------------------------------

test.summary();

fjord.close();

}); }); r.close();
}); }); r.close();
}); }); r.close();

// -------------------------------------------------------------------

