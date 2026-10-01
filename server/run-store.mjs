export const RUN_TTL_MS=60*60*1000;
const validId=id=>typeof id==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);

function snapshot(run,now){
  const {hours:localHours,...local}=run.local;
  const {hours:referenceHours,...reference}=run.reference;
  return {runId:run.runId,local,reference,processing:run.processing,at:now};
}

export function createMemoryRunStore({now=Date.now}={}){
  const runs=new Map();
  return {
    async set(run){
      for(const [id,value] of runs)if(now()-value.at>=RUN_TTL_MS)runs.delete(id);
      if(runs.size>=50)runs.delete(runs.keys().next().value);
      runs.set(run.runId,snapshot(run,now()));
    },
    async get(id){
      if(!validId(id))return null;
      const run=runs.get(id);
      if(!run)return null;
      if(now()-run.at>=RUN_TTL_MS){runs.delete(id);return null;}
      return run;
    },
  };
}

// The adapter is lazy: Netlify supplies the Blobs context for each invocation.
export function createBlobRunStore(openStore,{now=Date.now}={}){
  return {
    async set(run){await openStore().setJSON(run.runId,snapshot(run,now()));},
    async get(id){
      if(!validId(id))return null;
      const store=openStore();
      const run=await store.get(id,{type:'json',consistency:'strong'});
      if(!run)return null;
      if(!Number.isFinite(run.at)||now()-run.at>=RUN_TTL_MS){await store.delete(id);return null;}
      return run;
    },
  };
}
