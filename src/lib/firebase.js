// Firebase SDK initialization
// Analytics automatically tracks page views and visitor counts
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

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
export const analytics = getAnalytics(app);

// Helper: log a custom page_view with the page name
export function trackPage(pageName) {
  logEvent(analytics, 'page_view', { page_title: pageName });
}
