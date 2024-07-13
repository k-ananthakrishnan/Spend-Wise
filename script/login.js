import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA31BnyL8BMRqZnlOAMKpj3v7pSSvwwVMM",
    authDomain: "login-using-cdea5.firebaseapp.com",
    projectId: "login-using-cdea5",
    storageBucket: "login-using-cdea5.appspot.com",
    messagingSenderId: "734426507176",
    appId: "1:734426507176:web:b04e86999304f7501f1f9d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";
const provider = new GoogleAuthProvider();

window.addEventListener("load", function () {
    const googleLoginButton = document.getElementById("login-btn");
    if (googleLoginButton) {
        googleLoginButton.addEventListener("click", function () {
            console.log("Login button clicked. Initiating sign-in process.");
            signInWithPopup(auth, provider)
                .then((result) => {
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const user = result.user;
                    console.log("Sign-in successful. User:", user);

                    // Save user data in localStorage or sessionStorage
                    sessionStorage.setItem("user", JSON.stringify(user));

                    window.location.href = "./../index.html"; 
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error(`Error during sign-in: ${errorCode}: ${errorMessage}`);
                });
        });
    } else {
        //
    }

    const logoutButtons = document.querySelectorAll("#logout-btn-large, #logout-btn-small");
    logoutButtons.forEach(logoutButton => {
        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                console.log("Logout button clicked");
                signOut(auth).then(() => {
                    // Sign-out successful.
                    console.log("Sign-out successful.");
                    sessionStorage.removeItem("user");
                    window.location.href = "./login.html"; 
                }).catch((error) => {
                    console.error("Error during sign-out:", error);
                });
            });
        } else {
            console.error("Logout button not found.");
        }
    });
});
