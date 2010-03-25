var sys = require("sys");
var xml = require("./node-xml");

var Element = function(parent) {
    this.parent = parent;
    this.attrs  = {};
    
    this.getParent = function() {
        return parent;
    }
    
    this.toString = function() {
        return this['content'] || "";
    }
    
    this.setAttrs = function(nAttrs) {
        for(var i in nAttrs) {
            this.attrs[nAttrs[i][0]] = nAttrs[i][1];
        }
    }
    
    this.getAttrs = function() {
        return this.attrs;
    }
    
    this.attr = function(key) {
        return this.attrs[key];
    }
}

exports.parseString = function(string, successcb) {
    var parser = new xml.SaxParser(function(cb) {
        var current_tree = [];
        var previous_object = null;
        var current_object = null;

        cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
            current_object = new Element(current_object);
            current_object.setAttrs(attrs);
            var parent = current_object.getParent();
            if(parent == null) return;
            if(typeof(parent[elem]) === "undefined") {
                parent[elem] = current_object;
            } else if(parent[elem].constructor == Array) {
                parent[elem].push(current_object);
            } else {
                parent[elem] = [parent[elem], current_object];
            }
        });
        
        cb.onCharacters(addContent);
        cb.onCdata(addContent);
        
        function addContent(str) {
            if(!current_object) return;
            if(typeof(current_object["content"]) == "undefined") current_object["content"] = "";
            current_object["content"] += str;
        }
        
        cb.onEndElementNS(function(elem, prefix, uri) {
            if(current_object.getParent() == null) {
                var obj = {};
                obj[elem] = current_object;
                successcb(obj);
            } else {
                var p = current_object
                current_object = current_object.getParent();
            }
        });
    });
    
    parser.parseString(string);
}
