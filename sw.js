const CACHE_NAME="pflege-v2";
const SHELL=["./","./index.html","./style.css","./app.js","./firebase.js","./manifest.json","./icon.svg","./qr.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{const r=event.request;if(r.method!=="GET")return;if(r.url.includes("googleapis.com")||r.url.includes("gstatic.com")||r.url.includes("firebaseio.com"))return;event.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(response=>{if(response&&response.status===200&&response.type!=="opaque"){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(r,copy))}return response}).catch(()=>caches.match("./index.html"))))});
