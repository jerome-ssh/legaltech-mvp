# LawMate PWA Testing Guide

## Prerequisites
1. Chrome or Edge browser (latest version)
2. Node.js and npm installed
3. Development environment set up

## Local Testing Setup

1. Start the development server:
```bash
npm run dev
```

2. Open Chrome DevTools (F12 or right-click > Inspect)

3. Go to Application tab and check:
   - Service Workers section
   - Cache Storage
   - IndexedDB
   - Application Manifest

## Testing Checklist

### 1. Basic PWA Features
- [ ] App can be installed
- [ ] App icon appears in launcher
- [ ] App opens in standalone window
- [ ] App has correct name and description
- [ ] App has correct theme colors
- [ ] App has correct icons

### 2. Offline Functionality
- [ ] App loads without internet
- [ ] Cached resources are available offline
- [ ] App shows offline indicator
- [ ] App recovers when back online

### 3. Push Notifications
- [ ] Permission request works
- [ ] Notifications are received
- [ ] Notifications are clickable
- [ ] Notification actions work
- [ ] Badge updates correctly

### 4. Background Sync
- [ ] Data syncs in background
- [ ] Failed requests are retried
- [ ] Sync completes when online
- [ ] User is notified of sync status

### 5. Performance
- [ ] App loads quickly
- [ ] Transitions are smooth
- [ ] No layout shifts
- [ ] Memory usage is reasonable

## Testing Tools

1. Lighthouse Audit:
```bash
# Run in Chrome DevTools > Lighthouse
# Select:
- Progressive Web App
- Performance
- Best practices
- Accessibility
```

2. Service Worker Testing:
```javascript
// In Chrome DevTools Console
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));
```

3. Cache Testing:
```javascript
// In Chrome DevTools Console
caches.keys()
  .then(keys => console.log(keys));
```

## Common Issues and Solutions

1. Service Worker Not Registering:
   - Check if HTTPS is enabled
   - Verify service worker file path
   - Clear browser cache

2. Push Notifications Not Working:
   - Verify VAPID keys
   - Check notification permissions
   - Ensure subscription is stored

3. Offline Mode Issues:
   - Verify cache strategy
   - Check cache storage
   - Clear and rebuild cache

## Performance Metrics

Target metrics for optimal performance:
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.8s
- Speed Index: < 3.4s
- Total Blocking Time: < 300ms

## Security Considerations

1. Verify HTTPS:
```bash
# Check SSL certificate
openssl s_client -connect localhost:3000
```

2. Check Content Security Policy:
```javascript
// In Chrome DevTools Console
document.querySelector('meta[http-equiv="Content-Security-Policy"]')
```

3. Verify Service Worker Scope:
```javascript
// In Chrome DevTools Console
navigator.serviceWorker.controller
```

## Deployment Checklist

Before deploying to production:
1. [ ] Update manifest.json with production URLs
2. [ ] Verify all icons are present
3. [ ] Test on multiple devices
4. [ ] Check performance metrics
5. [ ] Verify offline functionality
6. [ ] Test push notifications
7. [ ] Review security settings

## Monitoring

Set up monitoring for:
1. Service Worker registration success rate
2. Push notification delivery rate
3. Cache hit/miss ratio
4. Offline usage statistics
5. Performance metrics

## Support

For issues or questions:
1. Check browser console for errors
2. Review service worker logs
3. Test in different browsers
4. Verify network requests
5. Check database connections 