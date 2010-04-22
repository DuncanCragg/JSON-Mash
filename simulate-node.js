
if(typeof(require)=='undefined'){

 require=function(p){
    if(p=='sys') return { puts: function(s){} };
    if(p=='fs' ) return { createReadStream: function(filename, options){ return null; }};
 };

 exports = {};
}

