const a=location.pathname.split("/").slice(0,-1).join("/"),u=[a+"/_app/immutable/entry/app.QSvDc3SF.js",a+"/_app/immutable/nodes/0.Dg_3SL6v.js",a+"/_app/immutable/assets/0.BZEQc955.css",a+"/_app/immutable/nodes/1.DrFOKc1S.js",a+"/_app/immutable/nodes/10.CN0v77hi.js",a+"/_app/immutable/nodes/11.DR7PJr4H.js",a+"/_app/immutable/nodes/12.Ds9IE6lA.js",a+"/_app/immutable/nodes/13.aWJbaftJ.js",a+"/_app/immutable/nodes/14.D4PAC1UG.js",a+"/_app/immutable/nodes/15.DuQgRvXW.js",a+"/_app/immutable/nodes/16.BTraV9jf.js",a+"/_app/immutable/nodes/2.C4_CqTeu.js",a+"/_app/immutable/nodes/3.CGwrJnmz.js",a+"/_app/immutable/assets/3.C6XpIQV4.css",a+"/_app/immutable/nodes/4.ROymup5Q.js",a+"/_app/immutable/nodes/5.BJISEX1n.js",a+"/_app/immutable/assets/5.Dc8H6yY4.css",a+"/_app/immutable/nodes/6.D1CNpMHC.js",a+"/_app/immutable/nodes/7.sJFU43jZ.js",a+"/_app/immutable/nodes/8.DhZFBTDG.js",a+"/_app/immutable/nodes/9.0lh9-CSL.js",a+"/_app/immutable/assets/9.Bd5Efdy4.css",a+"/_app/immutable/chunks/1R2GlNHj.js",a+"/_app/immutable/chunks/5_ZOgByb.js",a+"/_app/immutable/chunks/7B96tlKl.js",a+"/_app/immutable/chunks/81uDzRXJ.js",a+"/_app/immutable/chunks/B-G8ztNa.js",a+"/_app/immutable/chunks/B21QHDWq.js",a+"/_app/immutable/chunks/BFGHZJqN.js",a+"/_app/immutable/chunks/BGsM1btW.js",a+"/_app/immutable/chunks/BVcDlHOj.js",a+"/_app/immutable/chunks/BZZLp1oO.js",a+"/_app/immutable/chunks/Ba9nytLd.js",a+"/_app/immutable/chunks/BluUn2SV.js",a+"/_app/immutable/chunks/BvMhsobz.js",a+"/_app/immutable/chunks/C--5t8Yx.js",a+"/_app/immutable/chunks/CDQxWuWv.js",a+"/_app/immutable/chunks/CEtDmXYx.js",a+"/_app/immutable/chunks/COHKNyhF.js",a+"/_app/immutable/chunks/CSn65FV0.js",a+"/_app/immutable/chunks/CVvYbTkW.js",a+"/_app/immutable/chunks/CYSWjtEC.js",a+"/_app/immutable/chunks/CYq1lwc4.js",a+"/_app/immutable/chunks/CdwG3dgp.js",a+"/_app/immutable/chunks/ChEqcw_R.js",a+"/_app/immutable/chunks/CuEaehTG.js",a+"/_app/immutable/chunks/CyNC9QLA.js",a+"/_app/immutable/chunks/D12q7Q36.js",a+"/_app/immutable/chunks/D9J-t_xT.js",a+"/_app/immutable/chunks/DEPQPQt8.js",a+"/_app/immutable/chunks/DFPLsyL_.js",a+"/_app/immutable/chunks/DHcjO8WO.js",a+"/_app/immutable/chunks/DNJl1ib1.js",a+"/_app/immutable/chunks/DXadS_Hu.js",a+"/_app/immutable/chunks/DZbIYM4O.js",a+"/_app/immutable/chunks/DuGwofyl.js",a+"/_app/immutable/chunks/PPVm8Dsz.js",a+"/_app/immutable/chunks/REG38ZGk.js",a+"/_app/immutable/chunks/TDtrdbi3.js",a+"/_app/immutable/chunks/YlzsQZ6z.js",a+"/_app/immutable/chunks/lxx4mEY1.js",a+"/_app/immutable/chunks/m6Yt8xyM.js",a+"/_app/immutable/chunks/mTzi4Dm6.js",a+"/_app/immutable/chunks/tw1RdNRP.js",a+"/_app/immutable/entry/start.Dr6gCdH-.js",a+"/_app/immutable/chunks/BcLaVOC9.js",a+"/_app/immutable/chunks/DICRm4o3.js",a+"/_app/immutable/chunks/B5CaCgBQ.js",a+"/_app/immutable/chunks/B4SNXARi.js",a+"/_app/immutable/chunks/DmYj-g2y.js",a+"/_app/immutable/chunks/E7PTwa2f.js"],r=[a+"/apple-touch-icon.png",a+"/favicon.png",a+"/icon-192.png",a+"/icon-512.png",a+"/manifest.json",a+"/robots.txt"],h="1771944209173",o=`cache-${h}`,c="/offline",l=[...u,...r];self.addEventListener("install",t=>{async function e(){const n=await caches.open(o);await n.addAll(l);try{const s=new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Offline — Smart E-VISION</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #f0f4ff 0%, #e8edf8 100%);
            color: #1a1a2e;
            padding: 2rem;
        }
        .container {
            text-align: center;
            max-width: 400px;
        }
        .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            border-radius: 1.25rem;
            background: linear-gradient(135deg, #0038A8, #002a7a);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            font-weight: 800;
            box-shadow: 0 8px 32px rgba(0, 56, 168, 0.2);
        }
        h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
        p { color: #555577; line-height: 1.6; margin-bottom: 1.5rem; }
        button {
            padding: 0.875rem 2rem;
            background: #0038A8;
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,56,168,0.3); }
        button:active { transform: translateY(0); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">E</div>
        <h1>You're Offline</h1>
        <p>Don't worry — your queued uploads are saved and will sync automatically when your connection is restored.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>`,{headers:{"Content-Type":"text/html; charset=utf-8"}});await n.put(c,s)}catch(s){console.warn("[SW] Failed to cache offline page:",s)}}self.skipWaiting(),t.waitUntil(e())});self.addEventListener("activate",t=>{async function e(){for(const n of await caches.keys())n!==o&&await caches.delete(n)}t.waitUntil(e().then(()=>self.clients.claim()))});self.addEventListener("fetch",t=>{if(t.request.method!=="GET")return;const e=new URL(t.request.url);if(e.origin!==self.location.origin)return;async function n(){const s=await caches.open(o);if(l.includes(e.pathname)){const i=await s.match(t.request);if(i)return i}try{const i=await fetch(t.request);if(!(i instanceof Response))throw new Error("Invalid response from fetch");return i.status===200&&s.put(t.request,i.clone()),i}catch(i){const p=await s.match(t.request);if(p)return p;if(t.request.mode==="navigate"){const m=await s.match(c);if(m)return m}throw i}}t.respondWith(n())});self.addEventListener("sync",t=>{t.tag==="sync-offline-uploads"&&t.waitUntil(self.clients.matchAll().then(e=>{e.forEach(n=>{n.postMessage({type:"SYNC_OFFLINE_QUEUE"})})}))});self.addEventListener("push",t=>{const e=t.data?.json()??{},n=e.title||"Smart E-VISION",s={body:e.body||"You have a new notification",icon:"/icon-192.png",badge:"/favicon.png",tag:e.tag||"default",data:{url:e.url||"/dashboard"},actions:e.actions||[],vibrate:[100,50,100]};t.waitUntil(self.registration.showNotification(n,s))});self.addEventListener("notificationclick",t=>{t.notification.close();const e=t.notification.data?.url||"/dashboard";t.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:!0}).then(n=>{for(const s of n)if(s.url.includes(e)&&"focus"in s)return s.focus();return self.clients.openWindow(e)}))});
