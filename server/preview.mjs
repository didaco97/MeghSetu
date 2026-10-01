// Production frontend server for Netlify Dev; API requests are handled by Netlify.
import express from 'express';
import {fileURLToPath} from 'node:url';

const app=express();
app.disable('x-powered-by');
app.use((req,res,next)=>{
  // Netlify CLI can send Windows filesystem separators for existing asset paths.
  // Normalize those URL separators before Express confines files to dist.
  req.url=req.url.replace(/%5c/gi,'/').replaceAll('\\','/');
  res.setHeader('Cache-Control','no-store');
  next();
});
app.use(express.static(fileURLToPath(new URL('../dist',import.meta.url)),{dotfiles:'deny',etag:false,lastModified:false}));
const server=app.listen(4174,'127.0.0.1',()=>console.log('Netlify frontend preview ready on http://127.0.0.1:4174'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
