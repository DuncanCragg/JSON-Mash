#!/usr/bin/env node

var sys = require('sys');
var http = require('http');

var xml2object = require('./lib/xml2object');

var test = require('../fjord/simple-test');

sys.puts('------------------ SSI and CSI Tests ---------------------');

// -------------------------------------------------------------------

var client = http.createClient(8080, "localhost");

var headers = { "Host": "localhost:8080" };

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-73c2-4046-fe02-7312.json", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is application/json", "application/json", contentType);

var statusCode = response.statusCode;
test.isEqual("Status is 200", 200, statusCode);

var owid = response.headers["content-location"].match(/(owid-[-0-9a-z]+)\.json$/)[1];
test.isEqual("OWID is correct in Content-Location", "owid-73c2-4046-fe02-7312", owid);

var etag = parseInt(response.headers["etag"].substring(1));
test.isEqual("ETag is 1", 1, etag);

var cacheNotify = response.headers["cache-notify"];
test.isEqual("Cache-Notify is http://localhost:8080/fjord/cache-notify",
             "http://localhost:8080/fjord/cache-notify", cacheNotify);

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

var r=client.request("GET", "/a/b/c/owid-123-abc.html", headers);

r.addListener("response", function(response){

var contentType = response.headers["content-type"];
test.isEqual("Content-Type is text/html", "text/html", contentType);

var statusCode = response.statusCode;
test.isEqual("Status is 200", 200, statusCode);

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

xml2object.parseString(body, function(xmlobj) {

test.isEqual("Header text set",
              xmlobj.html.body.table.tr.td[0].h1.content,
             "Object Notation and UX Object Notation");

test.isEqual("MML text set",
              xmlobj.html.body.div.div.p[0].content,
             "Let\'s look at a small Object:");

test.isEqual("MML pre-formatted text set",
              xmlobj.html.body.div.div.p[1].pre.content,
             " O(\n { \"owid\": \"owid-123-456\",\n \"content\": { \"wrapper\": \"owid-4ead-f007\",\n \"title\": \"Introduction\",\n \"content\": { \"mml\": [ \n \"Welcome to JSON-Mash!\"\n ] }\n }\n }\n)\n ");

test.isEqual("MML text set",
              xmlobj.html.body.div.div.p[2].i.content,
              "... to be continued.");

});

// -------------------------------------------------------------------

var r=client.request("GET", "/a/b/c/owid-456-789.html", headers);

r.addListener("response", function(response){

var body = "";
response.setBodyEncoding("utf8");
response.addListener("data", function(chunk){ body+=chunk; });
response.addListener("end", function(){

xml2object.parseString(body, function(xmlobj) {

test.isEqual("Header text set",
              xmlobj.html.body.table.tr.td[0].h1.content,
             "Embedded Demo");

test.isEqual("MML text set",
              xmlobj.html.body.div.div.p[1].content,
             "Here is a lazy-loaded Object graph:");

test.isEqual("Links set (not!)",
              xmlobj.html.body.div.div.a[0].getAttrs().href,
             "http://localhost:8080/u/owid-111-222.js");

test.isEqual("MML text set",
              xmlobj.html.body.div.div.p[2].content,
             "Here is a self-referring Object:");

test.isEqual("Links set (not!)",
              xmlobj.html.body.div.div.a[1].getAttrs().href,
             "http://localhost:8080/u/owid-999-999.js");

// -------------------------------------------------------------------
test.summary();

});

}); }); r.close();
}); }); r.close();
}); }); r.close();
}); }); r.close();
}); }); r.close();

// -------------------------------------------------------------------

