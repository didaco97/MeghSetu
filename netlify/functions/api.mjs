import {createNetlifyApi} from '../../server/netlify-handlers.mjs';
import {netlifyRunStore} from '../../server/netlify-store.mjs';

export default createNetlifyApi({runStore:netlifyRunStore});
export const config={
  path:'/api/*',
  excludedPath:'/api/forecast',
  rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'},
};
