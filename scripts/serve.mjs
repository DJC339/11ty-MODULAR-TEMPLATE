// Local verification server: emulates static headers and invokes the REAL contact handler.
// Its injected upstream accepts data without storing or sending it. This cannot prove Netlify delivery.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createContactHandler} from '../netlify/functions/contact.mjs';
const port=Number(process.env.PORT || 8181);
const handler=createContactHandler({env:k=>({ENABLE_CONTACT:'true',CONTACT_FORM_NAME:'1234567890abcdef'.repeat(2),DEPLOY_URL:'https://test.netlify.app'})[k],send:async()=>new Response('',{status:200}),log:()=>{}});
const root=path.resolve('_site');
const rules=[];
for(const line of (await readFile('_site/_headers','utf8')).split('\n')) {
 if(line.startsWith('/'))rules.push({pattern:line,headers:{}});
 else if(line.trim()) {const pos=line.indexOf(':');rules.at(-1).headers[line.slice(0,pos).trim()]=line.slice(pos+1).trim();}
}
function headersFor(route) {const headers={};for(const rule of rules)if(rule.pattern.endsWith('*')?route.startsWith(rule.pattern.slice(0,-1)):rule.pattern===route)Object.assign(headers,rule.headers);return headers;}
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain','.webp':'image/webp','.jpeg':'image/jpeg','.avif':'image/avif'};
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(url.pathname==='/api/contact') {
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   // Translate the local browser origin to the simulated HTTPS deploy origin only.
   const incomingHeaders={...req.headers};
   if(incomingHeaders.origin===`http://127.0.0.1:${port}`)incomingHeaders.origin='https://test.netlify.app';
   const response=await handler(new Request('https://test.netlify.app/api/contact',{method:req.method,headers:incomingHeaders,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
   res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
  }
  let code=200, route=decodeURIComponent(url.pathname);
  let file=path.resolve(root,'.'+route);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
  if(route==='/__forms.html') {code=404;file=root+'/404.html';}
  else {try {if((await stat(file)).isDirectory())file=path.join(file,'index.html');await stat(file);}catch {code=404;file=root+'/404.html';}}
  res.writeHead(code,{...headersFor(route),'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  res.end(req.method==='HEAD'?'':await readFile(file));
 }catch {res.writeHead(500);res.end('Local verification server error');}
}).listen(port,'127.0.0.1',()=>console.log(`Verification server: http://127.0.0.1:${port}`));
