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

