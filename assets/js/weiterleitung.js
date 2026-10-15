/* Weiterleitung von /vorlagen/ mit Anker auf die neue Technik-Seite. Laeuft synchron vor dem Meta-Refresh. */
(function(){var h=document.documentElement,z=[];try{z=JSON.parse(h.getAttribute("data-ziele")||"[]")}catch(e){}
var a=location.hash.slice(1),b=h.getAttribute("data-basis")||"../techniken/";location.replace(a&&z.indexOf(a)>-1?b+a+"/":b)})();
