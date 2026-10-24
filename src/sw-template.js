importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);
workbox.loadModule('workbox-background-sync');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);


const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, NetworkOnly } = workbox.strategies;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// La URL de la API llega desde index.html (REACT_APP_API_URL) como parámetro del registro
const apiUrl = new URL(
  new URL(self.location).searchParams.get('apiUrl'),
  self.location.origin
).href.replace(/\/$/, '');
const apiPath = new URL(apiUrl).pathname;
const isEventsRequest = ({ url }) => url.href.startsWith(`${apiUrl}/events`);

const cacheNetworkFirst = [
  `${apiPath}/auth/renew`,
  `${apiPath}/events`,
]

const cacheFirstNetwork = [
  'https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0-2/css/all.min.css'
]


registerRoute(
  ({ _request, url }) => cacheNetworkFirst.some(cacheNetworkUrl => cacheNetworkUrl.includes(url.pathname)),
  new NetworkFirst()
)

registerRoute(
  ({ _request, url }) => cacheFirstNetwork.some(cacheUrl => cacheUrl.includes(url.href)),
  new CacheFirst()
)


//POSTEOS OFFLINE 
const bgSyncPlugin = new BackgroundSyncPlugin('posteos-offline', {
  maxRetentionTime: 24 * 60,
});


registerRoute(
  isEventsRequest,
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'POST',
)

registerRoute(
  isEventsRequest,
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'PUT',
)


registerRoute(
  isEventsRequest,
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'DELETE',
)


