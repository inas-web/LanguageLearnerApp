// services/firebaseConfig.js
export const checkFirebaseConfig = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyCvqmz4UdD76f-6xD9CbdGlH2Qf59dK-nY",
    authDomain: "languagelearnerapp-1f930.firebaseapp.com",
    projectId: "languagelearnerapp-1f930",
    storageBucket: "languagelearnerapp-1f930.firebasestorage.app",
    messagingSenderId: "1032175647378",
    appId: "1:1032175647378:web:0f9173b5b004ae168f844b"
  };

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  
  for (const field of requiredFields) {
    if (!firebaseConfig[field]) {
      console.error(`Firebase config error: ${field} is missing or empty`);
      return false;
    }
  }
  
  console.log("Firebase configuration is valid");
  return true;
};