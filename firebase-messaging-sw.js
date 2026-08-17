importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
})

const messaging = firebase.messaging()
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'AXS update'
  const options = { body: payload.notification?.body || 'You have a new AXS notification.', icon: '/a6dfbbd55_Screenshot_20260515-022106_GooglePlayStore.jpg', data: payload.data || {} }
  self.registration.showNotification(title, options)
})
