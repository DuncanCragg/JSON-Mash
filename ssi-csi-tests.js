#!/usr/bin/env node

var sys = require('sys');
var http = require('http');

var test = require('../fjord/simple-test');

sys.puts('------------------ SSI and CSI Tests ---------------------');

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

var r=client.request("GET", "/u/owid-73c2-4046-fe02-7312.js?x=1324134", headers);

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

var r=client.request("GET", "/a/b/c/owid-123-abc.html", headers);

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
             "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\">\n  <head>\n    <meta http-equiv=\"Content-Type\" content=\"application/xhtml+xml; charset=UTF-8\"/>\n    <link rel=\"stylesheet\"  type=\"text/css\"        href=\"/css/json-mash.css\" />\n    <link rel=\"stylesheet\"  type=\"text/css\"        href=\"/css/site.css\" />\n  </head>\n  <body>\n<table onmousedown=\"return linkdrop(this,'http://localhost:8080/u/owid-123-abc.js')\" class=\"mash-u-tbar\"><tr>\n<td class=\"mash-u-tbar-title\"><h1 class=\"mash-u-tbar-h1\">Object Notation and UX Object Notation</h1></td>\n<td class=\"mash-u-tbar-controls\"><div onmousedown=\"getObject('http://localhost:8080/u/owid-123-abc.js', true); return false;\" class=\"mash-u-reload\"><img src=\"/img/reload.png\" title=\"reload\" /></div>\n<div onmousedown=\"return linkpick(event, this,'http://localhost:8080/u/owid-123-abc.js')\" class=\"mash-u-dragdrop\"><img src=\"/img/linkto.png\" title=\"grab link (drop in a titlebar)\" /></div>\n<div onmousedown=\"document.location='http://localhost:8080/u/owid-123-abc.js'\" class=\"mash-u-seejson\"><img src=\"/img/jsonto.png\" title=\"view source\" /></div>\n<div onmousedown=\"setViewPoint(event, 'owid-123-abc'); return false; \" class=\"mash-u-setviewpoint\"><img src=\"/img/jumpto.png\" title=\"set viewpoint to this\" /></div>\n<div onmousedown=\"openClose(event, 'next', 'mash-u-tbar', true)\" class=\"mash-u-toggle\"><img src=\"/img/isopen.png\" title=\"open/close\" /></div>\n</td>\n</tr></table>\n<div class=\"mash-u-main\"><div class=\"mash-mml-wrapper\"><p class=\"mash-para\">Let's look at a small Object:</p>\n<p class=\"mash-para\"><pre> O(\n { &quot;owid&quot;: &quot;owid-123-456&quot;,\n &quot;content&quot;: { &quot;wrapper&quot;: &quot;owid-4ead-f007&quot;,\n &quot;title&quot;: &quot;Introduction&quot;,\n &quot;content&quot;: { &quot;mml&quot;: [ \n &quot;Welcome to JSON-Mash!&quot;\n ] }\n }\n }\n)\n </pre></p>\n<p class=\"mash-para\"><i>... to be continued.</i></p>\n</div></div>\n\n  </body>\n</html>\n"
);

// -------------------------------------------------------------------

test.summary();

}); }); r.close();
}); }); r.close();
}); }); r.close();

// -------------------------------------------------------------------

