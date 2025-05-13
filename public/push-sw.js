// Push notification service worker
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    },
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'sync-cases') {
    event.waitUntil(syncCases());
  } else if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
});

async function syncCases() {
  try {
    const response = await fetch('/api/cases/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    
    if (data.updates > 0) {
      self.registration.showNotification('Case Updates', {
        body: `${data.updates} cases have been updated`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
      });
    }
  } catch (error) {
    console.error('Failed to sync cases:', error);
  }
}

async function syncDocuments() {
  try {
    const response = await fetch('/api/documents/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    
    if (data.updates > 0) {
      self.registration.showNotification('Document Updates', {
        body: `${data.updates} documents have been updated`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
      });
    }
  } catch (error) {
    console.error('Failed to sync documents:', error);
  }
}

// Advanced caching strategies
const CACHE_NAME = 'lawmate-cache-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';
const OFFLINE_QUEUE_KEY = 'offline-queue';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/dashboard-192x192.png',
  '/icons/crm-192x192.png',
  '/icons/analytics-192x192.png'
];

const API_ENDPOINTS = [
  '/api/cases',
  '/api/documents',
  '/api/clients',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE).then(cache => cache.addAll(API_ENDPOINTS))
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline operations
self.addEventListener('sync', function(event) {
  if (event.tag === 'process-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
});

// Periodic sync for data updates
self.addEventListener('periodicsync', function(event) {
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(handlePeriodicSync(event.tag));
  }
});

// Helper functions
async function processOfflineQueue() {
  try {
    const queue = await getOfflineQueue();
    for (const item of queue) {
      try {
        await processQueueItem(item);
        await removeFromQueue(item.id);
      } catch (error) {
        console.error('Failed to process queue item:', error);
        await updateQueueItemStatus(item.id, 'failed', error.message);
      }
    }
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

async function handlePeriodicSync(tag) {
  const resourceType = tag.replace('sync-', '');
  
  try {
    switch (resourceType) {
      case 'cases':
        await syncCases();
        break;
      case 'documents':
        await syncDocuments();
        break;
      case 'messages':
        await syncMessages();
        break;
    }
  } catch (error) {
    console.error(`Failed to sync ${resourceType}:`, error);
  }
}

async function syncCases() {
  const response = await fetch('/api/cases/sync', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync cases');
  }
  
  const cases = await response.json();
  const cache = await caches.open(CACHE_NAME);
  
  // Cache case data
  for (const caseData of cases) {
    await cache.put(
      `/api/cases/${caseData.id}`,
      new Response(JSON.stringify(caseData))
    );
  }
}

async function syncDocuments() {
  const response = await fetch('/api/documents/sync', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync documents');
  }
  
  const documents = await response.json();
  const cache = await caches.open(CACHE_NAME);
  
  // Cache document metadata
  for (const doc of documents) {
    await cache.put(
      `/api/documents/${doc.id}`,
      new Response(JSON.stringify(doc))
    );
  }
}

async function syncMessages() {
  const response = await fetch('/api/messages/sync', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync messages');
  }
  
  const messages = await response.json();
  const cache = await caches.open(CACHE_NAME);
  
  // Cache message data
  for (const message of messages) {
    await cache.put(
      `/api/messages/${message.id}`,
      new Response(JSON.stringify(message))
    );
  }
}

async function getOfflineQueue() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(`/${OFFLINE_QUEUE_KEY}`);
  return response ? await response.json() : [];
}

async function removeFromQueue(id) {
  const queue = await getOfflineQueue();
  const updatedQueue = queue.filter(item => item.id !== id);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    `/${OFFLINE_QUEUE_KEY}`,
    new Response(JSON.stringify(updatedQueue))
  );
}

async function updateQueueItemStatus(id, status, error = null) {
  const queue = await getOfflineQueue();
  const updatedQueue = queue.map(item => {
    if (item.id === id) {
      return { ...item, status, error };
    }
    return item;
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    `/${OFFLINE_QUEUE_KEY}`,
    new Response(JSON.stringify(updatedQueue))
  );
}

async function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-case':
      await clients.openWindow(`/cases/${data.caseId}`);
      break;
    case 'view-document':
      await clients.openWindow(`/documents/${data.documentId}`);
      break;
    case 'view-message':
      await clients.openWindow(`/messages/${data.messageId}`);
      break;
  }
} 