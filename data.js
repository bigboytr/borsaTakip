/**
 * Created by user1 on 13.11.2017.
 */

$(document).ready(function () {

    var provider = new firebase.auth.GoogleAuthProvider();


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

    // Get a reference to the database service
    var database = firebase.database();

    // Vars
    var shares;

    // User vars
    var token;
    var user;

    if (token === undefined) {
        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            token = result.credential.accessToken;
            // The signed-in user info.
            user = result.user;

            init();

        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;

            console.log(error);
        });
    } else {
        init();
    }


    function init() {

        // Fake data
        /*database.ref(user.uid + "/shares").push({
            share_title: "THY",
            share_code: "THYAO"
        });*/

        // get shares from database by logged user
        getSharesByUser();

        // save data
        /*database.ref('faturalar/'+yil+"/"+ay+"/"+tip+"/").set({
         tutar : tutar
         });*/


        // data url
        //var url = "https://www.doviz.com/api/v1/stocks/ASELS/latest";
        // portföy listele
        //portfoyList();

        // ilk çalıştırma
        //data_request();

        // 3 saniyede bir sor
        //setInterval(data_request, 3000);
    }



    function getSharesByUser() {

        var datas = database.ref(user.uid+'/shares');

        Vue.component("shares", {
            template: "#share-template",
            data: function () {
                return {
                    followed: [],
                    snapshot: []
                }
            },
            created: function () {
                datas.once('value').then(function(snapshot) {

                    this.snapshot = snapshot.val();
                    var obj = [];
                    var i = 0;
                    var maxChild = snapshot.numChildren();

                    this.$http.get('/data.php?hisse=asels', function(price){

                        obj[i++] = {
                            "share_title": element.share_title,
                            "share_code": element.share_code,
                            "share_price": price
                        };

                        if (i === maxChild) {
                            finish();
                        }

                    }).bind(this);

                    /*$.each(this.snapshot, function (index, element) {



                        /!*data_request(function(price){





                        }, function() {

                        }, element.share_code);*!/
                    });*/

                    function finish() {
                        this.followed = obj;
                        console.log(this.followed);
                    }
                });
            }
        });

        new Vue ({
            el: "#shares"
        });
    }




    //var url = "data.php";
    //var hisseKod = "ASELS";
    var price = 0;
    var kapanis = 42.10;

    // yekunler vars
    var ylot = 0;
    var ymaliyet = 0;
    var ylot_maliyet = 0;
    var ykomisyon = 0;
    var yalis = 0;

    // Nodes
    var ykarzararNode;
    var ykasaNode;

    function data_request(success, failure, hisseKod) {
      $.ajax({
          type: 'POST',
          url: "data.php",
          data: "hisse="+hisseKod,
          crossDomain: true,
          contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
          success: function (data) {

              if (data === "0") {
                  price = 0;
              } else {

                  // global var.
                  // anlık hisse değeri
                  price = parseFloat(data.replace(",","."));
              }

              success(price);
              //calculate();
          },
          error: function (xhr, ajaxOptions, thrownError) {

              failure(thrownError);
          }
      });
    }

    function calculate() {

        // hisse anlık değeri
        $("#price").text(price.toFixed(2));

        var ykarzarar = 0;
        hisseler.forEach(function (item, index) {

            var lotMaliyet = parseFloat(item.alis) * parseInt(item.lot);
            var maliyet = lotMaliyet + parseFloat(item.komisyon);
            var lotAnlik = price * parseInt(item.lot);

            var karzarar = lotAnlik - lotMaliyet;

            var class_name = (lotAnlik > maliyet) ? "green" : "red";

            ///////
            var listElement = document.getElementById("list");
            listElement.childNodes[index].childNodes[6].innerHTML = karzarar.toFixed(2) + " ₺";
            listElement.childNodes[index].childNodes[6].setAttribute("class", class_name);

            // yekün karzarar
            ykarzarar += karzarar;
        });

        var class_name = (ykarzarar > 0) ? "green" : "red";
        ykarzararNode.setAttribute("class", class_name);
        ykarzararNode.innerHTML = ykarzarar.toFixed(2) + " ₺";
        ykasaNode.innerHTML = (ylot_maliyet + ykarzarar).toFixed(2);

    }

    function portfoyList() {

        var listElement = document.getElementById("list");
        ykarzararNode = document.getElementById("ykarzarar");
        ykasaNode = document.getElementById("ykasa");
        var html = "";

        listElement.innerHTML = "";


        hisseler.forEach(function (item) {

            var lotMaliyet = parseFloat(item.alis) * parseInt(item.lot);
            var maliyet = lotMaliyet + parseFloat(item.komisyon);

            html += '<tr>';
            html += '<td>'+item.hisse+'</td>';
            html += '<td>'+item.lot+'</td>';
            html += '<td class="visible-md visible-lg">'+item.alis.toFixed(2)+' ₺</td>';
            html += '<td>'+lotMaliyet.toFixed(2)+' ₺</td>';
            html += '<td class="visible-md visible-lg">'+item.komisyon.toFixed(2)+' ₺</td>';
            html += '<td class="visible-md visible-lg">'+maliyet.toFixed(2)+' ₺</td>';
            html += '<td></td>';
            html += '<td class="visible-md visible-lg">'+item.tarih+'</td>';

            // yekünler
            ylot += item.lot;
            ymaliyet += maliyet;
            ylot_maliyet += lotMaliyet;
            ykomisyon += item.komisyon;


        });

        yalis = ylot_maliyet / ylot;
        listElement.innerHTML = html;
        document.getElementById("ylot").innerHTML = ylot;
        document.getElementById("ylot_maliyet").innerHTML = ylot_maliyet.toFixed(2) + " ₺";
        document.getElementById("ymaliyet").innerHTML = ymaliyet.toFixed(2) + " ₺";
        document.getElementById("ykomisyon").innerHTML = ykomisyon.toFixed(2) + " ₺";
        document.getElementById("yalis").innerHTML = yalis.toFixed(2) + " ₺";
    }
});
