import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyDJUanKnJhCwZil0070JCvFsl_ptRJ6z5U",authDomain:"volodyka-d0e6f.firebaseapp.com",projectId:"volodyka-d0e6f",storageBucket:"volodyka-d0e6f.firebasestorage.app",messagingSenderId:"897772118836",appId:"1:897772118836:web:d14da433651226be85bb61",measurementId:"G-2E8YD99FSF"};
const firebaseApp=initializeApp(firebaseConfig);
export const auth=getAuth(firebaseApp);
export const db=getFirestore(firebaseApp);
