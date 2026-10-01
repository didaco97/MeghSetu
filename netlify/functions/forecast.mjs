import {createNetlifyForecast} from '../../server/netlify-handlers.mjs';
import {netlifyRunStore} from '../../server/netlify-store.mjs';

export default createNetlifyForecast({runStore:netlifyRunStore});
export const config={
  path:'/api/forecast',
  rateLimit:{windowLimit:25,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'},
};
