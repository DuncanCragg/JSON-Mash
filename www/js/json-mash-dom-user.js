/*
    -------------------------------------------------
    Always generate HTML inside single quotes ('),
    because in text, (") -> &quot; but may have (')
    -------------------------------------------------
*/


// ------ ----------------------- -------

urlbase = null;
docloc  = document.location+'';

var wrapstack=[];
var fetchedsite = false;

var notificationURL = null;
var useruid = null;
var getting={};
var cache = {};
var histrack=[];
var histrind=0;

// ------ ----------------------- -------

function bodyLoaded() {
    refreshPage();
}

function setViewPoint(evt, uid){
    if(!evt) evt=window.event;
    var target = evt.target? evt.target: evt.srcElement;
    var vp = getFirstParentOfClass(target, 'mash-viewpoint');
    if(!vp) return;
    var vpid = vp.id;
    recordHistory();
    putVPCSIsIntoFrag(vpid, uid);
    startOver();
}

function recordHistory(){
    histrack[histrind++]=(document.location+'');
    histrack=histrack.slice(0,histrind);
}

function goBack(){
    if(histrind==0) return;
    if(histrind==histrack.length){
        recordHistory();
        histrind--; 
    }
    window.location = histrack[--histrind];
    startOver();
}

function goForward(){
    if(histrind+1>=histrack.length) return;
    window.location = histrack[++histrind];
    startOver();
}

function startOver(){
    document.title = '';
    fetchedsite = false;
    window.scrollTo(0,0);
    refreshPage();
}

function refreshPage(){
    var urlbases = getLinksByRel('mash-urlbase');
    if(urlbases && urlbases.length==1){
        urlbase = ""+urlbases[0];
        if(urlbase.endsWith('/')) urlbase=urlbase.substring(0,urlbase.length-1);
    }
    notificationURL = makeFullURL('u/notifications.js');
    var loc = locationAndFrag();
    if(loc.length==2) putFragIntoVPCSIs(loc[1]);
    else              putVPCSIsIntoFrag(null,null);
    ensureCSIsBeingFilled();
}

function ensureCSIsBeingFilled(){
    var csis = getLinksByRel('mash-csiobject');
    for(var i=0; i<csis.length; i++){
        var csi = csis[i];
        if(csi.className=="mash-drawn") continue;
        if(isNotVisible(csi)) continue;
        var url = getURLFromLink(csi);
        url = adjustIfUserURL(url);
        if(!url) continue;
        getObject(url, false);
    }
    setNotificationChannel();
}

// ------ Object Resource Protocol -------

function getObject(url, really){
    if(!really && cache[url]){
        incomingObject(url, cache[url], 'cache');
        return;
    }
    var uid = url2owid(url);
    if(!getting[uid]){
        if(getting[url2owid(notificationURL)]){
            cancelNotifications();
        }
        getting[uid] = true
        addOrReplaceScript(url);
    }
}

function setNotificationChannel(){
    if(nothingPending()) getObject(notificationURL, true);
}

function cancelNotifications(){
    userChanged();
}

function nothingPending(){
    for(uid in getting){
        if(getting[uid] == true) return false;
    }
    return true;
}

function addOrReplaceScript(url){
    removeScript(url);
    appendToHead(scriptElement(url));
}

function removeScript(url){
    var scripts = getHead().getElementsByTagName('script');
    for(var i=0; i<scripts.length; i++){
        var s = scripts[i];
        if(s.src.contains(url)){
            getHead().removeChild(s);
            return;
        }
    }
}

function O(o){
    var uid=o.owid;
    var url=owid2url(uid);
    getting[uid] = false;
    cache[url] = o;
    incomingObject(url, o, 'fetch');
}

function pushO(o){
    var url=owid2url(o.owid);
    getting[url2owid(notificationURL)] = false;
    cache[url] = o;
    incomingObject(url, o, 'notify');
}

// ------------ M -> V: Drawing the Object Web ------------

function incomingObject(url, o, source){
    var content = o.content;
    var vpsite = document.getElementById('vpsite');
    if(vpsite && !fetchedsite) setTitle(content);
    if(vpsite && !fetchedsite && content['wrapper']){
        wrapstack.unshift(url);
        resetVPCSILink(vpsite, content.wrapper);
    }
    else{
        setCSIsFromJSON(url, o, source);
        doInDOMWork();
    }
    ensureCSIsBeingFilled();
}

function setCSIsFromJSON(url, o, source){
    var html = makeHTMLFromJSON(url, o.content);
    setCSIsFromHTML(url, html, source);
    if(url.contains(useruid)){
        html = makeThisUserHTML(url, o.content);
        setCSIsFromHTML('u/owid-user.js', html, source);
    }
}

function setCSIsFromHTML(url, html, source){
    var links = getLinksByHrefAndEmpty(url);
    for(var i=0; i<links.length; i++){
        var link = links[i];
        setCSI(link, html, source);
    }
}

function setCSI(link, html, source){
    if(source=='cache' && link.className=='mash-drawn') return;
    var s;
    if((s=getSiblingElementIf('previous', link, 'div', 'mash-csiobject'))){
        setInnerHTML(s, html);
    } else {
        s=divElementClass('mash-csiobject', html);
        insertSiblingBefore(link, s);
    }
    link.className='mash-drawn';
    if(mustBeClosed(link, s)) closeObject(s);
}

function doInDOMWork(){
    // setFocus();
}

function setFocus(){
    var s = document.getElementById('mash-usersaying');
    if(s){ s.setAttribute('autocomplete','off'); s.focus(); }
}

// ------------ C -> M: Affecting the Object Web ------------

function userChanged(evt){
    evt = evt || window.event;
    if((!evt || evt.keyCode == 10 || evt.keyCode == 13) && useruid){
        userSubmit(makeFullURL('/users/u/'+useruid+'.js'), '');
    }
}

function userDragEvent(target){
    if(!peerselected) return;
    if(!useruid) return;
    var o = cache[target];
    if(o.content['content'] && isList(o.content.content)){
        var list=o.content.content;
        var applying = ''
        if(type(list) == 'OrderedHash'){
            var psstr = url2owid(peerselected);
            var drop=null;
            var first=true;
            var order = list['-order-'];
            var ulstr = '{ ';
            for(var i=0; i<order.length; i++){
                var t=order[i];
                var v=list[t];
                if(!v) continue;
                if(v==psstr){ drop = i; continue; }
                if(!v.constructor===String) v='*'; else if(v.length > 90) v='*';
                ulstr += (first? '"': ',\n"') + t.jsonEscape() + '": "' + v.jsonEscape() + '"';
                first=false;
            }
            ulstr += (first? '': ',\n')+((drop==null)? ('"newsub": "' + psstr + '",\n'): '');
            if(drop==null) order.unshift("newsub");
            else           order.splice(drop,1);
            ulstr += orderList(order);
            ulstr += '\n }';
            applying = '"' + url2owid(target) + '",\n                        { "content": '+ulstr+' }';
        }
        userSubmit(target, applying);
    }
}

function orderList(order){
    var first=true;
    var s = '"-order-": [ ';
    for(var i=0; i<order.length; i++){
        var t=order[i];
        s += (first? '"': ', "') + t.jsonEscape() + '"';
        first=false;
    }
    s += ' ]';
    return s;
}

function userSubmit(target, applying){
    var name   = "name?";
    var saying = "saying?";
    var nameel   = document.getElementById('mash-username'  );
    var sayingel = document.getElementById('mash-usersaying');
    if(nameel)   name   = nameel.value.jsonEscape();
    if(sayingel) saying = sayingel.value.jsonEscape();

    var user = 'O(\n    { "owid": "'+useruid+'",\n      "content": {\n    "user": { "name": "'+name.jsonEscape()+'",\n              "saying": "'+saying.jsonEscape()+'",\n              "viewing": [  ],\n              "applying": [ '+applying+' ]\n    }\n  }\n    }\n)';

    var form = newForm(target);
    newInput(form, 'user', user);
    submitAndClean(form);
}

function newForm(action){
    var form = document.createElement('form');
    form.method='post'
    form.action=action;
    form.target='posttarget';
    document.body.appendChild(form);
    return form;
}

function newInput(form, name, value){
    if(value==null) return;
    var input=document.createElement('input');
    input.type='hidden';
    input.name=name;
    input.value=value;
    form.appendChild(input);
}

function submitAndClean(form){
    form.submit();
    document.body.removeChild(form);
}

// ---------- Links ------------------------------

function locationAndFrag(){
    return (document.location+'').split('#');
}

function putVPCSIsIntoFrag(setvpid, setuid){
    var f='#';
    var csis = getLinksByRel('mash-csiobject');
    var v=0;
    for(var i=0; i<csis.length; i++){
        var csi = csis[i];
        var vp = getSiblingElementIf('previous', csi, 'div', 'mash-viewpoint');
        if(!vp) continue;
        var vpid = vp.id;
        var uid  = (vpid == setvpid? setuid: url2owid(getURLFromLink(csi)));
        if(v>0) f+='&';
        f+=(vpid+'='+escape(uid));
        v++;
    }
    window.location = locationAndFrag()[0] + f;
}

function putFragIntoVPCSIs(frag){
    var vpids = unpackVPs(frag);
    for(var vpid in vpids){
        var uid = vpids[vpid];
        if(!uid || !uid.constructor===String) continue;
    //  if(!isOwid(uid)) continue
        var vp=document.getElementById(vpid);
        if(!vp) continue;
        resetVPCSILink(vp, uid);
    }
}

function resetVPCSILink(vp, uid){
    var csi = getSibling('next', vp, 'a', null);
    if(!csi) return;
    csi.className=null;
    csi.href=owid2url(uid);
}

function timBLimgCSI(url){
    return '<img src="'+url+'" />';
}

function adjustIfUserURL(url){
    if(url.contains('u/owid-user.js')){
        useruid = getCookie('useruid');
        if(!useruid) return null;
        return url.replace(/\/u\/useruid/, "/users/u/"+useruid);
    }
    return url;
}

function unpackVPs(frag){
    var vps={};
    var vpbits = frag.split('&');
    for(var x=0; x<vpbits.length; x++){
        var vpbit = vpbits[x];
        var vpbittv = vpbit.split('=');
        vps[vpbittv[0]] = unescape(vpbittv[1]);
    }
    return vps;
}

function mustBeClosed(link, n){
    var v = getURLFromLink(link);
    var i = 0;
    var toodeep = 8;
    do{
        if(n && isClass(n, 'mash-u-closed')) return true;
        n = n.parentNode;
        if(n && isClass(n, 'mash-csiobject')){
            i++;
            if(i >= toodeep) return true;
            var l = getSibling('next', n, 'a', null);
            var u = getURLFromLink(l);
            if(u==v && !isClass(getTitleBar(n), 'mash-u-tbar-notitle')) return true;
        }
    } while(n);
    return false;
}

function closeObject(s){
    var tbar  = getTitleBar(s);
    var main  = getSibling('next', tbar,  'div', 'mash-u-main');
    main.style.display = 'none';
}

function getTitleBar(s){
    var first = s.firstChild;
    var tbar  = isClass(first, 'mash-u-tbar')? first: getSibling('next', first, 'table', 'mash-u-tbar');
    return tbar;
}

// -----------------------------------------------

// ----------- JSON to HTML ----------------------

var utcs = ' class="mash-table"';
var utccs= ' class="mash-td-content'; // note no close quote
var upcs = ' class="mash-para"';

var uuhdcs=' class="mash-u-tbar"';
var uuhocs=' class="mash-u-tbar mash-u-tbar-notitle"';
var uhttcs=' class="mash-u-tbar-title"';
var uhh1cs=' class="mash-u-tbar-h1"';
var uconcs=' class="mash-u-tbar-controls"';
var urelcs=' class="mash-u-reload"';
var useecs=' class="mash-u-seejson"';
var usvpcs=' class="mash-u-setviewpoint"';
var utggcs=' class="mash-u-toggle"';
var udndcs=' class="mash-u-dragdrop"';
var uumncs=' class="mash-u-main"';
var uumocs=' class="mash-u-main mash-u-main-notitle"';

var umtcs =' class="mash-mml-table"';
var umtdcs=' class="mash-mml-td"';
var umwrcs=' class="mash-mml-wrapper"';

var uaics =' class="mash-atom-icon"';
var uascs =' class="mash-atom-subtitle"';
var uaecs =' class="mash-atom-entry"';
var uaetcs=' class="mash-atom-entry-title"';
var uadcs =' class="mash-atom-date"';
var uabcs =' class="mash-atom-body"';
var uaoics=' class="mash-atom-open-image"';

var uoctcs=' class="mash-openclose-toggle"';
var uocics=' class="mash-openclose-image"';

var uusrcs=' class="mash-user"';
var uusncs=' class="mash-user-name"';
var uusscs=' class="mash-user-saying"';
var uothcs=' class="mash-user-other"';
var uotscs=' class="mash-user-other-saying"';

function makeHTMLFromJSON(url, content){
    var uid = url2owid(url);
    var titlebarhtml = objectTitlebar(url, uid, content);
    var mainhtml = '[<a href="'+url+'">unrecognised content</a>]';

    if(content['user'])                                       mainhtml = user(     content.user);
    if(content['site'])                                       mainhtml = site(     content.site);
    if(content['content'] && isList(content.content))         mainhtml = list(     content.content);
    if(content['content'] && content.content['mml'])          mainhtml = mml(      content.content);
    if(content['tags'] && contains(content.tags,'atom'))      mainhtml = atom(     content);
    if(content['tags'] && contains(content.tags,'atomentry')) mainhtml = atomentry(content);

    return wrapObject(titlebarhtml, mainhtml);
}

function makeThisUserHTML(url, content){
    var uid = url2owid(url);
    var titlebarhtml = objectTitlebar(url, uid, content);
    var mainhtml = thisuser(content.user);
    return wrapObject(titlebarhtml, mainhtml);
}

function wrapObject(titlebarhtml, mainhtml){
    return titlebarhtml + '<div'+(titlebarhtml.contains('notitle')? uumocs: uumncs)+'>'+ mainhtml +'</div>\n';
}

function setTitle(content){
    if(content['site'] && content.site['title']) { document.title = document.title + ' | ' + content.site.title; }
    if(content['title'])                         { document.title = document.title + ' | ' + content.title; }
}

function objectTitlebar(url, uid, content){
    var title = null;

    if(content['user'] )                        { title = ' '; }
    if(content['user'] && content.user['name']) { title = content.user.name;  }
    if(content['title'])                        { title = content.title;      }

    var icon = atomIcon(content);
    var site = atomWebsite(content);
 // var vpt = locationAndFrag()[0] + '#vp=' + uid;

    var refrevent = ' onmousedown="getObject(\''+ url +'\', true); return false;"';
    var seejevent = ' onmousedown="document.location=\''+ url +'\'"';
    var setvevent = ' onmousedown="setViewPoint(event, \''+ uid +'\'); return false; "';
    var toggevent = ' onmousedown="openClose(event, \'next\', \'mash-u-tbar\', true)"';
    var pickevent = ' onmousedown="return linkpick(event, this,\''+url+'\')"';
    var dropevent = ' onmousedown="return linkdrop(this,\''+url+'\')"';

    var controls = '<div'+refrevent+urelcs+'><img src="img/reload.png" title="reload" /></div>\n'+
                   '<div'+pickevent+udndcs+'><img src="img/linkto.png" title="grab link (drop in a titlebar)" /></div>\n'+
                   '<div'+seejevent+useecs+'><img src="img/jsonto.png" title="view source" /></div>\n'+
                   '<div'+setvevent+usvpcs+'><img src="img/jumpto.png" title="set viewpoint to this" /></div>\n'+
                   '<div'+toggevent+utggcs+'><img src="img/isopen.png" title="open/close" /></div>\n';
               //  '<a'+usvpcs+' href="'+vpt+'"'+ setvevent + '><img src="img/jumpto.png" /></a>\n'+

    return '<table'+dropevent+(title? uuhdcs: uuhocs)+'><tr>\n'+
             '<td'+uhttcs+'>'+(icon? icon: '')+
                  '<h1'+uhh1cs+'>'+(site? '<a href="'+site+'">': '')+
                                   (title? title.htmlEscape(): uid)+(site? '</a>': '') + '</h1></td>\n'+
             '<td'+uconcs+'>' + controls +'</td>\n'+
           '</tr></table>\n';
}

function atomIcon(content){
    if(content['tags'] && content.tags['atom'] && content['icon']){
        var icon=content.icon.htmlEscape();
        if(content['atomfeed']){
            var feed=content.atomfeed.htmlEscape();
            return '<a href="'+feed+'"><img'+uaics+' src="'+icon+'" /></a>';
        }
        else{
            return '<img'+uaics+' src="'+icon+'" />';
        }
    }
    return null;
}

function atomWebsite(content){
    if(content['tags'] && content.tags['atom'] && content['website']){
        return owid2url(content.website);
    }
    if(content['tags'] && content.tags['atomentry'] && content['permalink']){
        return owid2url(content.permalink);
    }
    return null;
}

function thisuser(user){
    var name   = user.name  .htmlEscape();
    var saying = user.saying.htmlEscape();
    var events = ' onkeydown="userChanged(event); return true;"';
    var html=
'<div'+uusrcs+'>\n'+
    '<div>Name:   <input'+uusncs+' id="mash-username"   type="text" value="'+name  +'" '+events+' /></div>\n'+
    '<div>Saying: <input'+uusscs+' id="mash-usersaying" type="text" value="'+saying+'" '+events+' /></div>\n'+
'</div>\n';
    return html;
}

function user(user){
    var saying = user.saying.htmlEscape();
    var html = 
     '<div'+uothcs+'><div'+uotscs+'>"'+saying+'"</div></div>\n';
    return html;
}

function site(site){
    if(site['css']) appendToHead(styleElement(site.css));
    if(site['wrapping']){
        fetchedsite = true;
        var v = site.wrapping;
        if(v == '-x-'){
            if(wrapstack.length){
                return incLink(wrapstack.shift());
            }
        }
        else return string2HTML(v);
    }
    return 'No "wrapping" in site';
}

function list(list){
    var h='<table'+utcs+'>\n';
    if(type(list) == 'OrderedHash'){
        var order = list['-order-'];
        var horiz  = (list['dirn'] == 'horiz');
        var options = list['options'];
        var state   = list['state'];
        if(horiz) h+='<tr>';
        for(var i=0; i<order.length; i++){
            var t=order[i];
            var v=list[t];
            if(!v) continue;
            if(horiz) h+=       td(t, v, i==0,  options, state);
            else      h+='<tr>'+td(t, v, false, options, state)+'</tr>\n';
        }
        if(horiz) h+='</tr>\n';
    }
    else
    if(type(list)=='Array'){
        var horiz = false;
        var options = null;
        var state   = null;
        var s=0;
        for(; s<list.length; s++){
            if(list[s].startsWith('dirn:')){    horiz =   list[s].split(':')[1].contains('horiz'); }
            else
            if(list[s].startsWith('options:')){ options = list[s].split(':')[1]; }
            else
            if(list[s].startsWith('state:')){   state =   list[s].split(':')[1]; }
            else break;
        }
        if(horiz) h+='<tr>';
        for(var i=s; i<list.length; i++){
            var v=list[i];
            if(horiz) h+=       td('', v, i==0,  options, state);
            else      h+='<tr>'+td('', v, false, options, state)+'</tr>\n';
        }
        if(horiz) h+='</tr>\n';
    }
    h+='</table>\n';
    return h;
}

function td(t, v, narrowtd, options, state){

    var c='';
    if(v.constructor===String){
        if(t=='wrapping' && v == '-x-' && wrapstack.length){
            c = incLink(wrapstack.shift());
        }
        else{
            c = string2HTML(v);
        }
    }
    else
    if(isList(v)){
        c = list(v);
    }

    var h = '';
    var utdcs = ' class="mash-td' + (narrowtd? ' mash-narrowtd': '') + classOrId(t) + '"';

    if(options && options.contains('collapsible')){
        var closed = (state && state.contains('closed'));
        if(options.contains('objecttitle')){
            h = '<td'+utdcs+'><div'+utccs+(closed? ' mash-u-closed">':'">')+c+'</div></td>\n';
        }
        else{
            var smooth = options.contains('smooth');
            var onclick=' onmousedown="openClose(event, \'next\', \'mash-openclose-toggle\', '+smooth+')"';
            h = '<td'+utdcs+'><div'+uoctcs+onclick+'><img'+uocics+' src="img/isopen.png" /></div>'+
                             '<div'+utccs+(closed? '" style="display:none">': '" style="display:block">')+c+'</div></td>\n';
        }
    }
    else{
        h = '<td'+utdcs+'><div'+utccs+'">'+c+'</div></td>\n';
    }
    return h;
}

function mml(content){
    return MML2HTML(content);
}

function atom(atom){
    var h='';
    h+='<h5'+uascs+'>'+atom.subtitle+'</h5>';
    for(var x=0; x<atom.entries.length; x++){
        var e = atom.entries[x];
        if(!e) continue;
        var entryuid = e['%etc'];
        var onclick=' onmousedown="replaceParentContent(event, \''+ owid2url(entryuid)+'\')"';
        h+='<div'+uaecs+'>\n';
        h+='<a href="'+owid2url(e.permalink)+'"><h5'+uaetcs+'>'+e.title+'</h5></a>\n';
        h+='<div'+uadcs+onclick+'>'+ ISOToNiceDate(e.updated)+'<img'+uaoics+' src="img/isopen.png" /></div>\n';
        h+='</div>\n';
    }
    if(atom['atomfeed']){
        h+= '<a href="'+atom.atomfeed+'">[feed]</a>';
    }
    return h;
}

function atomentry(e){
    var h='';
    h+='<div'+uadcs+'>'+ ISOToNiceDate(e.updated)+'</div>\n';
    h+='<div'+uabcs+'>'+ MML2HTML(e.content)+'</div>';
    return h;
}

function classOrId(text){
    if(!text || text=='')    return '';
    if(text.startsWith('#')) return '" id="'+text.substring(1);
    if(text.startsWith('.')) return ' '+text.substring(1);
    return '';
}

// ------ Object Markup Language -> HTML --------------

function MML2HTML(content){
    var h='';
    h+='<div'+umwrcs+'>';
    var topmml=null;
    if(content['mml']){
        topmml = content.mml;
    }
    if(content.constructor===Array){
        topmml = content;
    }
    if(topmml){
        for(var x=0; x<topmml.length; x++){
            var mml = topmml[x];
            if(!mml) continue;
            if(mml.constructor===String){
                h+=string2HTML(mml);
            }
            else
            if(type(mml) == 'OrderedHash'){
                h+=list(mml);
            }
            else
            if(mml.constructor===Array && mml.length){
                if(mml[0].constructor===String){
                    h+='<ul>';
                    for(var y=0; y<mml.length; y++){
                        if(!mml[y]) continue;
                        h+='<li>'+MMLString2HTML(mml[y])+'</li>';
                    }
                    h+='</ul>';
                }
                else
                if(mml[0].constructor===Array){
                    h+='<table'+umtcs+'>';
                    for(var y=0; y<mml.length; y++){
                        h+='<tr>';
                        var m=mml[y];
                        if(!m) continue;
                        for(var z=0; z<m.length; z++){
                            h+='<td'+umtdcs+'>'+MMLString2HTML(m[z])+'</td>';
                        }
                        h+='</tr>';
                    }
                    h+='</table>';
                }
            }
            else h+=mml;
        }
    }
    h+='</div>';
    return h;
}

var linkre=/\[([^\[]+?)\]\[([^ ]+?)\]/g;
var boldre=/!\[(.+?)\]!/g;
var italre=/\/\[(.+?)\]\//g;
var prefre=/^\|\[(.+)\]\|$/g;
var codere=/\|\[(.+?)\]\|/g;

function MMLString2HTML(text){
    if(!text) return '';
    text=text.htmlEscape();
    text=text.replace(linkre, '<a href="$2">$1</a>');
    text=text.replace(boldre, '<b>$1</b>');
    text=text.replace(italre, '<i>$1</i>');
    if(text.startsWith('|[') && text.endsWith(']|')){
         text='<pre>'+text.substring(2, text.length-2)+'</pre>';
    }
    text=text.replace(codere, '<code>$1</code>');
    return text;
}

function string2HTML(v){
    if(isIMG(v)) return timBLimgCSI(v);
    if(isOwid(v)) return incLink(owid2url(v));
    if(isURL(v)) return incLink(v);
    ;            return '<p'+upcs+'>'+MMLString2HTML(v)+'</p>\n';
}

// ----------- Generic Functions -----------------

function incLink(url){
    return '<a rel="mash-csiobject" href="'+url+'"></a>\n';
}

function isOwid(text){
    return isLink(text) && text.startsWith('owid-') && !text.contains('/');
}

function isIMG(text){
    return (text.endsWith('.gif') || text.endsWith('.jpg') || text.endsWith('.png'));
}

function isURL(text){
    return isLink(text) && ( text.startsWith('http://') || text.startsWith('file://') );
}

function isLink(text){
    return text && text.length >=3 &&
          (text.startsWith('http://') || text.startsWith('file://') || text.startsWith('owid-'))
}

function owid2url(uid){
    if(isOwid(uid)){
        return makeFullURL('u/'+uid+'.js');
    }
    if(isURL(uid)){
        return uid;
    }
    return uid;
}

function url2owid(url){
    var e = url.indexOf('u/');
    if(e== -1) return url;
    return url.substring(e+2, url.length-3);
}

function makeFullURL(url){
    if(url.contains('://')) return url;
    var lp = locationPiecesAssumingLocationDoesntRedirect();
    if(urlbase){
        return urlbase + 
               (url.startsWith('/')? '': lp.base) + 
               (url.startsWith('#')? lp.file: '') + 
                url;
    }
    else{
        return lp.protocol + '://' + (lp.domain? lp.domain: '') + 
               (url.startsWith('/')? '': lp.base) + 
               (url.startsWith('#')? lp.file: '') + 
                url;
    }
}

// -----------------------------------------------

