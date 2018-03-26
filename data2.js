/**
 * Created by yasin on 16.12.2017.
 */
/*
 var hisseKod = {
 "ASELS": "Aselsan",
 "THYAO": "THY",
 "TAVHL": "TAV",
 "PGSUS": "Pegasus",
 "MGROS": "Migros",
 "BANVT": "Banvit",
 "TCELL": "Turkcell",
 "PETKM": "Petkim",
 "TTKOM": "Türk Telekom"
 };*/


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


    // yekunler vars
    var ylot = 0;
    var ymaliyet = 0;
    var ylot_maliyet = 0;
    var ykomisyon = 0;
    var yalis = 0;

    // Nodes
    var ykarzararNode = document.getElementById("ykarzarar");

    // User vars
    var token;
    var user;
    var user_hisseler;
    var user_portfoy;

    // Calculate vars
    var lot;
    var alis;
    var komisyon;

    if (token === undefined) {
        firebase.auth().signInWithPopup(provider).then(function (result) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            token = result.credential.accessToken;
            // The signed-in user info.
            user = result.user;

            getHisseler();
            getPortfoy();

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

    }

    // Kullanıcının takip ettiği hisseleri alıyoruz
    function getHisseler() {

        database.ref(user.uid + '/hisseler').once('value').then(function (snapshot) {

            user_hisseler = snapshot.val();


            // portföy ekle modal hisse select doldur
            var root = $("#modal_hisse");
            root.html("");
            $.each(user_hisseler, function (index, element) {

                root.append('<option value="' + element.share_code + '">' + element.share_title + '</option>');
            });

            var obj = [];
            var i = 0;
            var maxChild = snapshot.numChildren() - 1;

            $.each(user_hisseler, function (index, element) {

                $.get('./data.php?hisse=' + element.share_code, function (price) {

                    obj[i++] = {
                        "share_title": element.share_title,
                        "share_code": element.share_code,
                        "share_price": price
                    };

                    if (i === maxChild) {
                        finish(obj);
                    }

                });



            });

        });

        function finish(obj) {
            Vue.component("shares", {
                template: "#share-template",
                data: function () {
                    return {
                        followed: obj
                    }
                }
            });

            new Vue({
                el: "#shares"
            });
        }


    }

    function getPortfoy() {

        database.ref(user.uid + '/portfoy').once('value').then(function (snapshot) {

            user_portfoy = snapshot.val();

            var listElement = document.getElementById("list");
            ykarzararNode = document.getElementById("ykarzarar");
            ykasaNode = document.getElementById("ykasa");
            var html = "";

            listElement.innerHTML = "";


            $.each(user_portfoy, function (index, item) {

                alis = parseFloat(item.alis);
                lot = parseInt(item.lot);
                komisyon = item.komisyon !== "" ? parseFloat(item.komisyon) : 0;

                var lotMaliyet = alis * lot;
                var maliyet = lotMaliyet + komisyon;

                html += '<tr>';
                html += '<td>'+item.hisse+'</td>';
                html += '<td>'+lot+'</td>';
                html += '<td class="visible-md visible-lg">'+alis.toFixed(2)+' ₺</td>';
                html += '<td>'+lotMaliyet.toFixed(2)+' ₺</td>';
                html += '<td class="visible-md visible-lg">'+komisyon.toFixed(2)+' ₺</td>';
                html += '<td class="visible-md visible-lg">'+maliyet.toFixed(2)+' ₺</td>';
                html += '<td></td>';
                html += '<td class="visible-md visible-lg">'+item.tarih+'</td>';
                html += '<td>';
                html += '<button type="button" class="btn btn-sm btn-success sat" data-id="'+index+'"><span class="glyphicon glyphicon-export"></span></button>';
                html += '<button type="button" class="btn btn-sm btn-danger sil" data-id="'+index+'"><span class="glyphicon glyphicon-remove"></span></button>';
                html += '</td>';

                // yekünler
                ylot += lot;
                ymaliyet += maliyet;
                ylot_maliyet += lotMaliyet;
                ykomisyon += komisyon;

            });

            yalis = ylot_maliyet / ylot;
            listElement.innerHTML = html;
            document.getElementById("ylot").innerHTML = ylot;
            document.getElementById("ylot_maliyet").innerHTML = ylot_maliyet.toFixed(2) + " ₺";
            document.getElementById("ymaliyet").innerHTML = ymaliyet.toFixed(2) + " ₺";
            document.getElementById("ykomisyon").innerHTML = ykomisyon.toFixed(2) + " ₺";
            document.getElementById("yalis").innerHTML = yalis.toFixed(2) + " ₺";

        });
    }

    function calculate() {

        var ykarzarar = 0;
        var index = 0;
        $.each(user_portfoy, function (key, item) {

            alis = parseFloat(item.alis);
            lot = parseInt(item.lot);
            komisyon = item.komisyon !== "" ? parseFloat(item.komisyon) : 0;

            var hisse_price = parseFloat($("#"+item.hisse+"_price").text().replace(",",".").slice(0,-2));
            var lotMaliyet = alis * lot;
            var maliyet = lotMaliyet + komisyon;
            var lotAnlik = hisse_price * lot;

            var karzarar = lotAnlik - lotMaliyet;

            var class_name = (lotAnlik > maliyet) ? "green" : "red";

            ///////
            var listElement = document.getElementById("list");
            listElement.childNodes[index].childNodes[6].innerHTML = karzarar.toFixed(2) + " ₺";
            listElement.childNodes[index].childNodes[6].setAttribute("class", class_name);

            // yekün karzarar
            ykarzarar += karzarar;

            index++;
        });

        var class_name = (ykarzarar > 0) ? "green" : "red";
        ykarzararNode.setAttribute("class", class_name);
        ykarzararNode.innerHTML = ykarzarar.toFixed(2) + " ₺";

    }

    // 3 saniyede bir sor
    setInterval(calculate, 3000);

    $("#save_hisse").on("click", function () {
        var title = $("#hisse_title").val();
        var code = $("#hisse_code").val();

        database.ref(user.uid + "/hisseler").push({
            share_title: title,
            share_code: code
        }).then(function (result) {
            console.log(result.key);

            $("#hisse_ekle_modal").modal("hide");
            getHisseler();


        });
    });

    $("#save_portfoy").on("click", function () {
        var code = $("#modal_hisse").val();
        var alis = $("#modal_hisse_alis").val();
        var komi = $("#modal_hisse_komisyon").val();
        var lot = $("#modal_hisse_lot").val();
        var tarih = $("#modal_hisse_tarih").val();

        database.ref(user.uid + "/portfoy").push({
            hisse: code,
            alis: alis,
            lot: lot,
            komisyon: komi,
            tarih: tarih
        }).then(function (result) {

            getPortfoy();

        });
    });

    $("body").on("click", ".sil", function () {

        var id = $(this).attr("data-id");

        database.ref(user.uid + '/portfoy').child(id).remove().then(function () {
            getPortfoy();
            calculate();
        });
    });


    $('#portfoy_ekle_modal').on('show.bs.modal', function () {

        if (user_hisseler == null) {
            $("#portfoy_ekle_modal").modal("hide");
            alert("Takip edilecek hisse kaydetmeniz gerekiyor.");
            return false;
        }
    });

});