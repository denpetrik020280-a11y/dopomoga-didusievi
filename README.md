# PFLEGE — FINAL

Повна mobile-first збірка PFLEGE — «Допомога дідусеві». Vanilla HTML/CSS/JS + Firebase Web SDK + Firestore + PWA.

## Firebase
Project: `volodyka-d0e6f`
Family: `families/grandpa-help-demo`
Collections: `members`, `tasks`, `entries`
Адміністратор UID: `6PEnWw88snMJIg8HKtAh0jAlrME3`

Існуючі `entries` залишаються сумісними з полями `uid`, `child`, `taskId`, `taskName`, `hours`, `base`, `bonus`, `total`, `paid`, `status`, `date`, `createdAt`.

## Файли
- `index.html` — повна структура екранів
- `style.css` — преміальний dark/light mobile-first UI
- `app.js` — Auth, Firestore, роботи, історія, звіти, профіль, адміністратор
- `firebase.js` — існуючий Firebase config
- `manifest.json`, `sw.js`, `icon.svg` — PWA
- `qr.svg` — QR на Firebase Hosting
- `assets/*.png` — єдина художньо-фотографічна серія портретів з затвердженого макета

## Deploy
Заміни файли в існуючому репозиторії та виконай звичайний Firebase Hosting deploy. Новий Firebase-проєкт або нова структура Firestore не потрібні.
