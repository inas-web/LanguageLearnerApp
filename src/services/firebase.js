import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7ZsMYQugBxtHsNAfNJP00wQf21zEY4h0",
  authDomain: "languagelearnerapp-767c5.firebaseapp.com",
  projectId: "languagelearnerapp-767c5",
  storageBucket: "languagelearnerapp-767c5.firebasestorage.app",
  messagingSenderId: "337106122658",
  appId: "1:337106122658:web:322b4b6b5373f63898e4fb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();