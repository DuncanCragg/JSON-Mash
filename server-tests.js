#!/usr/bin/env node

var sys = require('sys');
var http = require('http');

var test = require('../fjord/simple-test');

sys.puts('------------------ CSI Tests ---------------------');

// -------------------------------------------------------------------

var client = http.createClient(8080, "localhost");

var headers = { "Host": "localhost:8080" };

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-73c2-4046-fe02-7312.json", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/json", contentType, "application/json");

var statusCode = response.statusCode;
test.isEqual("Status is 200", statusCode, 200);

var owid = response.headers["content-location"].match(/(owid-[-0-9a-z]+)\.json$/)[1];
test.isEqual("OWID is correct in Content-Location", owid, "owid-73c2-4046-fe02-7312");

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", etag, 1);

var cacheNotify = response.headers["cache-notify"];
test.isEqual("Cache-Notify is http://localhost:8080/fjord/cache-notify", cacheNotify,
                             "http://localhost:8080/fjord/cache-notify");

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isEqual("Test Server returned expected JSON content",
             JSON.parse(body), {"tags":["x","y"]}
);

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-73c2-4046-fe02-7312.js?x=1324134", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/javascript", contentType, "application/javascript");

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isEqual("Test Server returned expected Javascript content",
 body,
"O(\n{\"owid\":\"owid-73c2-4046-fe02-7312\",\"refs\":{},\"outlinks\":{},\"etag\":1,\"content\":{\"tags\":[\"x\",\"y\"]}}\n);\n"
);

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-123-abc.json", headers);

r.addListener("response", function(response){

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isEqual("Test Server returned expected JSON content",
 JSON.parse(body),
 {"wrapper":"owid-4ead-f007",
  "title":"Object Notation and UX Object Notation",
  "content":{
      "mml": ["Let's look at a small Object:",
              "|[ O(\n { \"owid\": \"owid-123-456\",\n \"content\": { \"wrapper\": \"owid-4ead-f007\",\n \"title\": \"Introduction\",\n \"content\": { \"mml\": [ \n \"Welcome to JSON-Mash!\"\n ] }\n }\n }\n)\n ]|",
              "/[... to be continued.]/"
      ]
  }
 }
);

// -------------------------------------------------------------------

var client = http.createClient(8880, "localhost");

var headers = { "Host": "localhost:8880" };

// -------------------------------------------------------------------

var r=client.request("GET", "/index.html", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is text/html", contentType, "text/html");

var statusCode = response.statusCode;
test.isEqual("Status is 200", statusCode, 200);

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

test.isTrue("Page contains 'csi'", body.indexOf("csi")!= -1);

// -------------------------------------------------------------------
test.summary();

}); }); r.end();
}); }); r.end();
}); }); r.end();
}); }); r.end();

// -------------------------------------------------------------------

