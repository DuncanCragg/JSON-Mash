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

