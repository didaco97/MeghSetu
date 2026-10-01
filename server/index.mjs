import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApi} from './api.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(root,'.env.local'),quiet:true});
const app=createApi(),port=Number(process.env.PORT||3074);
if(process.argv.includes('--production')){
  app.use(express.static(path.join(root,'dist')));
  app.get('/{*path}',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{
  const {createServer}=await import('vite');
  const vite=await createServer({root,server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);
}
const server=app.listen(port,'127.0.0.1',()=>console.log(`MeghSetu is ready at http://localhost:${port}`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>process.exit(0)));
