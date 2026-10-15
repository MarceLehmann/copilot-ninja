/* Synchron im head: Theme, Bewegung, Guertel und Dojo-Stand vor dem ersten Rendern (verhindert Layout-Spruenge). */
(function(d,w){var h=d.documentElement,ls,g=function(k){try{return ls.getItem(k)}catch(e){return null}};try{ls=w.localStorage}catch(e){}
var t=g("cn-theme"),o=g("copilot-ninja-theme");if(o){try{if(!t&&(o=="light"||o=="dark")){ls.setItem("cn-theme",o);t=o}ls.removeItem("copilot-ninja-theme")}catch(e){}}
if(t=="light"||t=="dark")h.setAttribute("data-theme",t);var b=g("cn-bewegung")=="aus";if(b)h.setAttribute("data-bewegung","aus");
try{var s=JSON.parse(g("cn-dojo-v1")||"null"),n=s&&s.guertel|0;if(n>0&&n<8)h.setAttribute("data-guertel",n);if(s&&(s.selbsttest||s.geuebt&&Object.keys(s.geuebt).length))h.className+=" hat-dojo"}catch(e){}
var r=w.matchMedia&&w.matchMedia("(prefers-reduced-motion: reduce)").matches;h.className+=" js"+(b||r?"":" anim")})(document,window);
