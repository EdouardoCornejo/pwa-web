importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);
workbox.loadModule('workbox-background-sync');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);


const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, NetworkOnly } = workbox.strategies;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

const baseUrl = 'http://localhost:4000/api/';

const cacheNetworkFirst = [
  '/api/auth/renew',
  '/api/events',
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
  new RegExp(`${baseUrl}events`),
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'POST',
)

registerRoute(
  new RegExp(`${baseUrl}events`),
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'PUT',
)


registerRoute(
  new RegExp(`${baseUrl}events`),
  new NetworkOnly(
    {
      plugins: [bgSyncPlugin],
    }
  ),
  'DELETE',
)


