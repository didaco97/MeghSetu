import {getDeployStore} from '@netlify/blobs';
import {createBlobRunStore} from './run-store.mjs';

// Isolated per deploy: previews cannot read production forecast sessions.
export const netlifyRunStore=createBlobRunStore(()=>getDeployStore({name:'forecast-runs',consistency:'strong'}));
