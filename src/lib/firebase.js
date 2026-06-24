// Firebase SDK initialization
// Analytics automatically tracks page views and visitor counts
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiCPV1SJaQI0c8CTvsICHzcgCWxzbZjrE",
  authDomain: "hazproject-83866.firebaseapp.com",
  projectId: "hazproject-83866",
  storageBucket: "hazproject-83866.firebasestorage.app",
  messagingSenderId: "345510141600",
  appId: "1:345510141600:web:9bdee7006cc2def61db3c5",
  measurementId: "G-E51QD68HXW"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Analytics is optional — guard with isSupported() to avoid crashes in
// restricted environments (incognito, ad-blockers, iframes, etc.)
export const analyticsPromise = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
);

// Helper: log a custom page_view with the page name
export async function trackPage(pageName) {
  const analytics = await analyticsPromise;
  if (analytics) logEvent(analytics, 'page_view', { page_title: pageName });
}
