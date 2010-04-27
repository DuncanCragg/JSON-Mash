
// ------ DHTML utilities ------------------------

function replaceParentContent(evt, url){
    if(!evt) evt=window.event;
    var target = evt.target? evt.target: evt.srcElement;
    while(target.tagName.toLowerCase() != 'div') target=target.parentNode;
    setInnerHTML(target.parentNode, incLink(url));
    ensureCSIsBeingFilled();
}

function openClose(evt, direction, className, smooth){
    if(!evt) evt=window.event;
    var target = evt.target? evt.target: evt.srcElement;
    while(!isClass(target, className)) target=target.parentNode;
    var openclose=getSibling(direction, target, 'div', null);
    var opening = (openclose.style.display == 'none');
    if(!smooth){
        openclose.style.display = (opening? 'block': 'none');
        if(opening) ensureCSIsBeingFilled();
    }
    else{
        var jumpheight = 100;
        if(!opening){
            openclose.style.overflow = "hidden";
            var startheight = openclose.offsetHeight;
            if(startheight > jumpheight) startheight = jumpheight;
            animate(openclose, "height", startheight, 0, -20, "px", 30, endClose);
        }
        else{
            openclose.style.overflow = "hidden";
            openclose.style.height = "0px";
            openclose.style.display = 'block';
            var endheight = jumpheight;
            animate(openclose, "height", 0, endheight, +20, "px", 30, endOpen);
        }
    }
}

function endClose(){ 
    currentanimee.style.overflow = "visible"; 
    currentanimee.style.display = 'none';
    currentanimee.style.height = null;
}

function endOpen(){ 
    currentanimee.style.overflow = "visible"; 
    currentanimee.style.height = null;
    ensureCSIsBeingFilled();
}

var currentanimee=null;
var currentparam=null;
var currentendfunc=null;
function animate(animee, param, start, end, increment, addontext, timeslots, endfunc){
    if(animee)  currentanimee = animee;
    if(param)   currentparam  = param;
    if(endfunc) currentendfunc= endfunc;
    var newstart = (start+increment);
    if(increment >0 && newstart > end) { currentendfunc(); return; }
    if(increment <0 && newstart < end) { currentendfunc(); return; }
    currentanimee.style[currentparam]= newstart + addontext;
    setTimeout('animate(null,null,'+newstart+','+end+','+increment+',"'+addontext+'",'+timeslots+',null)', timeslots);
}

// ------------ pick up and drop a link --------------------

var peerselected=null;
var linkto = null;

function linkpick(evt, star, url){
    evt = evt || window.event;
    linkto=divElementClass('linkpick', '<img src="img/linkto.png" />');
    linkto.style.position = 'absolute';
    linkto.style.zIndex = '100';
    linkmove(evt);
    document.body.appendChild(linkto);
    document.onmousemove = linkmove;
    peerselected = url;
    return false;
}

function linkmove(evt){
    evt = evt || window.event;
    linkto.style.left = evt.clientX + document.documentElement.scrollLeft - 18 + 'px';
    linkto.style.top  = evt.clientY + document.documentElement.scrollTop  - 18 + 'px';
    return false;
}

function linkdrop(headbar, url){
    if(!peerselected || peerselected == url) return;
    document.onmousemove = null;
    document.body.removeChild(linkto);
    linkto = null;
    userDragEvent(url);
    peerselected=null;
    return false;
}

// --------------- DOM Functions -----------------

function toggleStyles(){
    var s = document.getElementById('stylesheets');
    s.disabled = !s.disabled;
}

function stylesOn(){
    var s = document.getElementById('stylesheets');
    return !s.disabled;
}

function getSiblingElementIf(direction, e, sibTagName, sibClassName){
    if(!e) return null;
    var dir=direction+'Sibling';
    var n=e[dir];
    while(n && (n.nodeType!=1)){
        n=n[dir];
    }
    if(!n) return null;
    if(sibTagName   && !isTagged(n, sibTagName  )) return null;
    if(sibClassName && !isClass( n, sibClassName)) return null;
    return n;
}

function getSibling(direction, e, sibTagName, sibClassName){
    if(!e) return null;
    var dir=direction+'Sibling';
    var n=e[dir];
    while(n && (n.nodeType!=1 || n.tagName.toLowerCase()!=sibTagName || (sibClassName && !isClass(n, sibClassName)))){
        n=n[dir];
    }
    return n;
}

function getFirstParentOfClass(node, className){
    var n = node;
    do{
        n = n.parentNode;
    }
    while(n && !isClass(n, className));
    return n;
}

function getURLFromLink(a){
    var url = a.getAttribute('href');
    return makeFullURL(url);
}

function getFragFromLink(a){
    var url = a.getAttribute('href');
    var s = url.split('#');
    if(s.length==2) return s[1];
    return '';
}

function getLinksByRel(reln){
    var ret = new Array();
    var links = document.getElementsByTagName('a');
    for(var x=0; x< links.length; x++) {
        var link = links[x];
        var rel = link.getAttribute('rel');
        if(rel && rel==reln){
            ret[ret.length] = link;
        }
    }
    return ret;
}

function getLinksByHrefAndEmpty(url){
    var ret = new Array();
    var links = document.getElementsByTagName('a');
    for(var x=0; x < links.length; x++){
        var link = links[x];
        var href = getURLFromLink(link);
        if(href && href.endsWith(url) && !link.innerHTML){
            ret[ret.length] = link;
        }
    }
    return ret;
}

function isNotVisible(node){
    var n = node;
    while(n){
        if(!n.style) return false;
        if(n.style.display=='none') return true;
        n = n.parentNode;
    }
    return false;

}

function isTagged(node, tagName){
    return node.nodeType==1 && node.tagName.toLowerCase()==tagName;
}

function isClass(node, className){
    if(!node || !node.className) return false;
    if(node.className == className) return true;
    if(node.className.startsWith(      className + ' ')) return true;
    if(node.className.endsWith(  ' ' + className      )) return true;
    if(node.className.contains(  ' ' + className + ' ')) return true;
    return false;
}

function getHead(){
    return document.getElementsByTagName('head')[0];
}

function getCookie(name){
    if(document.cookie.length==0) return null;
    s=document.cookie.indexOf(name+"=")
    if(s== -1) return null;
    s=s+name.length+1;
    e=document.cookie.indexOf(";",s);
    if(e== -1) e=document.cookie.length;
    return unescape(document.cookie.substring(s,e));
}

// -----------------------------------------------

function appendToHead(element){
    getHead().appendChild(element);
}

function insertSiblingBefore(e1, e2){
    e1.parentNode.insertBefore(e2, e1);
}

// -----------------------------------------------

function scriptElement(url, nounique){
    var script = document.createElement('script');
    script.type= 'text/javascript';
    script.src = url+(nounique? "": ((/\?/.test(url)? "&": "?")+"x="+new Date().getTime()));
    return script;
}

function styleElement(url){
    var style = document.createElement('style');
    style.type= 'text/css';
    style.id="stylesheets";
    var content = '@import url('+url+');';
    try{ style.innerHTML = content; }catch(e){ style.innerText = content; }
    return style;
}

function divElementClass(className, html){
    var div = divElement(html);
    div.className = className;
    return div;
}

function divElement(html){
    var div = document.createElement('div');
    setInnerHTML(div, html);
    return div;
}

function setInnerHTML(target, html){
    target.innerHTML = html;
}

// -----------------------------------------------

function locationPiecesAssumingLocationDoesntRedirect(){
    var protocol = null;
    var domain   = null;
    var base = null;
    var file = null;
    var fragid = null;
    var x = docloc.split('://');
    protocol = x[0];
    if(!x[1].startsWith('/')){
        x = x[1].split('/');
        domain = x[0];
        x[1]='/'+x[1];
    }
    x = x[1].split('#');
    fragid = x[1]? x[1]: null;
    if(x[0].endsWith('/')){
        base = x[0];
    }
    else{
        var i=x[0].lastIndexOf('/');
        base = x[0].substring(0,i+1);
        file = x[0].substring(i+1);
    }
    return { protocol: protocol, domain: domain, base: base, file: file, fragid: fragid };
}

function ISOToNiceDate(iso){
    if(iso==null) return "[no date]";
    return iso.substring(0, iso.indexOf('T'));
}

function isList(o){
    return o.constructor===Array || o['-order-'];
}

function type(o){
    if(o.constructor===String) return 'String';
    if(o.constructor===Array)  return 'Array';
    if(o['-order-']) return 'OrderedHash';
    return 'Object';
}

function contains(arr, item){
    for(var i=0; i< arr.length; i++) if(arr[i]==item) return true;
    return false;
}

function JSONstringify(o){
    if(o.constructor===String) return o;
    if(o.constructor===Array) return '['+o.length+']';
    if(o.constructor===Object){
        var s = '{\n';
        for(var k in o){
           var v = JSONstringify(o[k]);
           if(v==null) continue;
           s+='   "'+k+'": '+v+'\n';
        }
        return s+'\n}';
    }
    return null;
}

String.prototype.contains   = function(s){ return (this.indexOf(s) != -1); }
String.prototype.startsWith = function(s){ return (this.indexOf(s) == 0); }
String.prototype.endsWith   = function(s){ var i=this.lastIndexOf(s); return (i != -1 && i == this.length - s.length); }
String.prototype.indexAfter = function(s,n){ var i=this.indexOf(s,n); if(i == -1) return -1; return i+s.length; }
String.prototype.trim       = function() { return this.replace(/(^\s+|\s+$)/g, ''); }

String.prototype.jsonEscape = function(){
    return this.replace(/\\/g, '\\\\')
               .replace(/"/g, '\\"');
}

String.prototype.htmlEscape = function(){
    return this.replace(/&/g,'&amp;')
               .replace(/</g,'&lt;')
               .replace(/>/g,'&gt;')
               .replace(/"/g,'&quot;');
}

// -----------------------------------------------


