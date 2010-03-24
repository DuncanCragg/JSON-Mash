/*
    -------------------------------------------------
    json-mash-csi.js (c) 2004-2010 Duncan Cragg
    Licensed under the GPL
    -------------------------------------------------
    Browser 'extension' to view the Object Web
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
    if(o.content['content'] && o.content.content.isList()){
        var list=o.content.content;
        var applying = ''
        if(list.type() == 'OrderedHash'){
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
                if(!v.isString) v='*'; else if(v.length > 90) v='*';
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

function csiLink(url){
    return '<a rel="mash-csiobject" href="'+url+'"></a>\n';
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
        if(!uid || !uid.isString) continue;
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

