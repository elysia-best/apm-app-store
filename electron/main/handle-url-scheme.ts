import { deepLink } from './deeplink';

deepLink.on("event", (query) => {
  console.log(`Deep link: event "event" fired with query: ${JSON.stringify(query)}`);
});