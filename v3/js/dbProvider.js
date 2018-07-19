/**
 * Created by yasin on 14.01.2018.
 */

var DB = (function () {

    var dbLocal = {};

    dbLocal.token = "";
    dbLocal.user = {};
    dbLocal.database = {};


    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {

            // The signed-in user info.
            dbLocal.user = user;

            // Get a reference to the database service
            dbLocal.database = firebase.database();

        } else {

            window.location = "login.html";
        }
    });

    return dbLocal;
})();