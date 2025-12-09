// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { 
  getFirestore, doc, collection, getDocs, query, where, limit,
  setDoc, updateDoc, addDoc, getDoc, runTransaction, increment
}
from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

export const firebaseConfig = {

apiKey: "AIzaSyBRhmjIVd7H_ebYGF_Tc4mfSzw8burPTLg",

authDomain: "cogtrain-78cee.firebaseapp.com",

projectId: "cogtrain-78cee",

storageBucket: "cogtrain-78cee.firebasestorage.app",

messagingSenderId: "990084534744",

appId: "1:990084534744:web:43baef314f6ca2839a22ad",

measurementId: "G-6KZCYX3E87"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const analytics = getAnalytics(app);

const db = getFirestore();

export {app, analytics, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
    getFirestore, doc, collection, getDocs, query, where, limit,
    setDoc, updateDoc, addDoc, getDoc, runTransaction, increment, db
}