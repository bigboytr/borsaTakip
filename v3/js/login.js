/**
 * Created by yasin on 7.01.2018.
 */

var loginIF = (function () {

    var login = {};

    var provider = new firebase.auth.GoogleAuthProvider();

    //DOM
    var login_button;

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAnDoNwkr8v73XwyUqKI_sn7VRbQXhw2uA",
        authDomain: "borsa-c202b.firebaseapp.com",
        databaseURL: "https://borsa-c202b.firebaseio.com",
        projectId: "borsa-c202b",
        storageBucket: "borsa-c202b.appspot.com",
        messagingSenderId: "89509812782"
    };
    firebase.initializeApp(config);

    login.init = function () {

    };

    login.authentication = function(success, failure) {

        firebase.auth().signInWithPopup(provider).then(function (result) {

            window.location = "index.html";

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;

            console.log(errorMessage);
        });

    };

    login.logout = function () {

        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            window.location = "index.html";

        }).catch(function(error) {
            // An error happened.
        });
    };


    return login;
})();