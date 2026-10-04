# PFLEGE — фінальна версія

Vanilla HTML/CSS/JavaScript + Firebase Web SDK + Firestore + PWA.

## Firebase
- Project: `volodyka-d0e6f`
- Family: `families/grandpa-help-demo`
- Collections: `members`, `tasks`, `entries`
- Existing `entries` fields remain compatible: `uid`, `child`, `taskId`, `taskName`, `hours`, `base`, `bonus`, `total`, `paid`, `status`, `date`, `createdAt`.

## Files
- `index.html` — UI and screens
- `style.css` — premium responsive design + light/dark themes
- `app.js` — application logic
- `firebase.js` — existing Firebase connection
- `manifest.json` — PWA manifest
- `sw.js` — service worker / app shell cache
- `icon.svg` — application icon
- `qr.svg` — QR code for https://volodyka-d0e6f.web.app

## Deploy
Upload/push the complete folder to Firebase Hosting. No Firebase project recreation is required.
