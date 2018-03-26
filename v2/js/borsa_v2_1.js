/**
 * Created by yasin on 16.12.2017.
 */
$(document).ready(function () {

    // yekunler vars
    var ylot = 0;
    var ymaliyet = 0;
    var ylot_maliyet = 0;
    var ykomisyon = 0;
    var yalis = 0;

    // Nodes
    var ykarzararNode = document.getElementById("ykarzarar");
    var bist_100 = $("#bist_100");
    var bist_change = $("#bist_change");
    var bist_high = $("#bist_high");
    var bist_low = $("#bist_low");

    var dolar = $("#dolar");
    var dolar_change = $("#dolar_change");
    var euro = $("#euro");
    var euro_change = $("#euro_change");

    // User vars
    var token;
    var user;
    var user_hisseler;
    var user_portfoy;

    // Calculate vars
    var lot;
    var alis;
    var komisyon;

    var obj = [];
    var i = 0;
    var maxChild = 0;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            getHisseler();
            getPortfoy();
            getKademeler();
            getHisseListesi();
        } else {
            window.location = "login.html";
        }
    });

    /*var globalHisselerHTML = new Vue({
        el: "#shares",
        template: "#share-template",
        data: {
            followed: []
        },
		computed: {
			orderedShares: function () {
				return _.orderBy(this.followed, 'share_title')
			}
		}
    });*/

    var globalKademelerHTML = new Vue({
        el: "#kademeler_container",
        template: "#kademeler-template",
        data: {
            links: []
        },
        computed: {
            orderedLinks: function () {
                return _.orderBy(this.links, 'kademe_title')
            }
        }
    });

    var hisseListesiHTML = new Vue({
        el: "#hisse_takip",
        data: {
            hisse_listesi: []
        },
        computed: {
            orderedList: function () {
				return _.fromPairs(_.sortBy(_.toPairs(this.hisse_listesi), function(a){return a[1]}))
            }
        }
    });

    /*var portfoyHTML = new Vue({
        el: "#hisse_container",
        template: "#hisse-template",
        data: {
            hisseler: [],
            fiyatlar: []
        },
        computed: {
            karZarar: function () {
                this.hisseler.forEach(function (item) {

                    console.log(item);
                    var price = this.fiyatlar[item.title];
                    var hisse_price = parseFloat(price);
                    var lotAnlik = hisse_price * item.lot;

                    var karzarar = lotAnlik - item.maliyet;

                    item["karZarar"] = karzarar.toFixed(2);

                });
            }
        }
    });*/

    var borsaHTML = new Vue({
        el: "#borsa",
        data: {
            fiyatlar: [],
            portfoy: []
        },
        computed: {
            orderedShares: function () {
                return _.orderBy(this.fiyatlar, 'share_title')
            }
        }

    });

    setInterval(price_request, 5000);
    setInterval(calculate, 5000);
    setInterval(bist100data, 60000);
    setInterval(dovizData, 30000);

    bist100data();
    dovizData();

    /*function hisse_listesi() {
        $.get('https://www.doviz.com/api/v1/stocks/all/latest', function (veri) {

            $.each(veri, function (index, element) {

                DB.database.ref("hisse_listesi/"+element.name).set({
                    hisse_ad: element.full_name
                });
            });

        });
    }*/

    // BIST100 verisi
    function bist100data() {

        $.get('https://www.doviz.com/api/v1/indexes/XU100/latest', function (bist) {
            bist_100.text("").text(parseInt(bist.latest));
            bist_high.text("").text(parseInt(bist.first_seance_highest));
            bist_low.text("").text(parseInt(bist.first_seance_lowest));
            bist_change.text("").text(bist.change_rate.toFixed(2));

            changePercentageColor(bist_change, bist.change_rate.toFixed(2));
        });
    }

    // Döviz verisi
    function dovizData() {

        $.get('https://www.doviz.com/api/v1/currencies/USD/latest', function (veri) {
            dolar.text("").text(veri.selling.toFixed(4));
            dolar_change.text("").text(veri.change_rate.toFixed(2));

            changePercentageColor(dolar_change, veri.change_rate.toFixed(2));
        });

        $.get('https://www.doviz.com/api/v1/currencies/EUR/latest', function (veri) {
            euro.text("").text(veri.selling.toFixed(4));
            euro_change.text("").text(veri.change_rate.toFixed(2));

            changePercentageColor(euro_change, veri.change_rate.toFixed(2));
        });
    }

    function changePercentageColor(node, perc) {
        if (perc > 0) {
            if (node.hasClass("red")) {
                node.removeClass("red");
            }
            if (!node.hasClass("green")) {
                node.addClass("green");
            }
        }
        if (perc < 0) {
            if (node.hasClass("green")) {
                node.removeClass("green");
            }
            if (!node.hasClass("red")) {
                node.addClass("red");
            }
        }
    }

    // Kullanıcının takip ettiği hisseleri alıyoruz
    function getHisseler() {

        DB.database.ref(DB.user.uid + '/hisseler').once('value').then(function (snapshot) {

            user_hisseler = snapshot.val();

            // portföy ekle modal hisse select doldur
            var root = $("#modal_hisse");
            root.html("");
            $.each(user_hisseler, function (index, element) {

                root.append('<option value="' + element.share_code + '">' + element.share_title + '</option>');
            });

            maxChild = snapshot.numChildren() - 1;

            price_request();

        });
    }

    function getPortfoy() {

        DB.database.ref(DB.user.uid + '/portfoy').once('value').then(function (snapshot) {

            user_portfoy = snapshot.val();
            var maxChild = snapshot.numChildren() - 1;

            var obj = [];
            var i = 0;

            $.each(user_portfoy, function (index, item) {

                alis = parseFloat(item.alis);
                lot = parseInt(item.lot);
                komisyon = item.komisyon !== "" ? parseFloat(item.komisyon) : 0;

                var lotMaliyet = alis * lot;
                var maliyet = lotMaliyet + komisyon;

                obj[i] = {
                    "index": index,
                    "title": item.hisse,
                    "alis": alis.toFixed(2),
                    "lot": lot,
                    "komisyon": komisyon.toFixed(2),
                    "maliyet": maliyet.toFixed(2),
                    "tarih": item.tarih

                };

                if (i === maxChild) {
                    borsaHTML.portfoy = obj;
                } else {
                    i++;
                }


                // yekünler
                /*ylot += lot;
                ymaliyet += maliyet;
                ylot_maliyet += lotMaliyet;
                ykomisyon += komisyon;*/

            });

            /*yalis = ylot_maliyet / ylot;
            listElement.innerHTML = html;
            document.getElementById("ylot").innerHTML = ylot;
            document.getElementById("ylot_maliyet").innerHTML = ylot_maliyet.toFixed(2) + " ₺";
            document.getElementById("ymaliyet").innerHTML = ymaliyet.toFixed(2) + " ₺";
            document.getElementById("ykomisyon").innerHTML = ykomisyon.toFixed(2) + " ₺";
            document.getElementById("yalis").innerHTML = yalis.toFixed(2) + " ₺";*/

        });
    }

    function getKademeler() {

        DB.database.ref('kademeler').once('value').then(function (snapshot) {

            var maxChild = snapshot.numChildren() - 1;

            var obj = [];
            var i = 0;
            $.each(snapshot.val(), function (key, element) {

                obj[i] = {
                    "kademe_title": element.kademe_title,
                    "kademe_link": element.kademe_link
                };

                if (i === maxChild) {
                    globalKademelerHTML.links = obj;
                } else {
                    i++;
                }

            });
        });
    }

    function getHisseListesi() {
        DB.database.ref('hisse_listesi').once('value').then(function (snapshot) {

            hisseListesiHTML.hisse_listesi = snapshot.val();
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
            listElement.childNodes[index].childNodes[5].innerHTML = karzarar.toFixed(2) + " ₺";
            listElement.childNodes[index].childNodes[5].setAttribute("class", class_name);

            // yekün karzarar
            ykarzarar += karzarar;

            index++;
        });

        var class_name = (ykarzarar > 0) ? "green" : "red";
        ykarzararNode.setAttribute("class", class_name);
        ykarzararNode.innerHTML = ykarzarar.toFixed(2) + " ₺";

    }

    function price_request() {

        obj = [];
        obj2 = [];
        i = 0;
        $.each(user_hisseler, function (key, element) {

            $.get('./services/borsa.php?hisse=' + element.share_code, function (price) {

                $.get("https://www.doviz.com/api/v1/stocks/"+element.share_code+"/latest", function (data) {

                    obj[i] = {
                        "share_key": key,
                        "share_title": element.share_title,
                        "share_code": element.share_code,
                        "share_price": price,
                        "share_change_rate": data.change_rate
                    };

                    obj2[element.share_code] = price;

                    if (i === maxChild) {
                        borsaHTML.fiyatlar = obj;
                    } else {
                        i++;
                    }
                });
            });
        });

    }

    $("#save_hisse").on("click", function () {
        var title = $("#hisse_takip").find(":selected").text();
        var code = $("#hisse_takip").find(":selected").val();

        DB.database.ref(DB.user.uid + "/hisseler").push({
            share_title: title,
            share_code: code
        }).then(function (result) {

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

        DB.database.ref(DB.user.uid + "/portfoy").push({
            hisse: code,
            alis: alis,
            lot: lot,
            komisyon: komi,
            tarih: tarih
        }).then(function (result) {

            $("#portfoy_ekle_modal").modal("hide");
            getPortfoy();

        });
    });

    $("#save_kademe").on("click", function () {
        var title = $("#kademe_title").val();
        var link = $("#kademe_link").val();

        DB.database.ref("kademeler").push({
            kademe_title: title,
            kademe_link: link
        }).then(function (result) {
			$("#kademe_ekle_modal").modal("hide");
            getKademeler();
        });
    });

    $("body").on("click", ".sil", function () {

        var node = $(this);
        swal({
            title: "Pozisyon Kapat !",
            text: "Portföyünüzdeki pozisyon kapatılacak, devam edilsin mi ?",
            icon: "warning",
            buttons: ["Vazgeç", "Tamam"],
            dangerMode: true

        }).then(function (response) {

            if (response) {

                var id = node.attr("data-id");

                DB.database.ref(DB.user.uid + '/portfoy').child(id).remove().then(function () {
                    getPortfoy();
                    calculate();
                }).then(function () {

                    swal("İşleminiz başarıyle gerçekleşti.", {
                        icon: "success"
                    });
                });
            }
        });
    });

    $('#portfoy_ekle_modal').on('show.bs.modal', function () {

        if (user_hisseler == null) {
            $("#portfoy_ekle_modal").modal("hide");
            alert("Takip edilecek hisse kaydetmeniz gerekiyor.");
            return false;
        }
    });

    $("body").on("click", ".hisse_sil", function () {

        var node = $(this);
        swal({
            title: "Hisse Sil !",
            text: "Hisse takip listesinden çıkarılacak, devam edilsin mi ?",
            icon: "warning",
            buttons: ["Vazgeç", "Tamam"],
            dangerMode: true

        }).then(function (response) {

            if (response) {

                var id = node.attr("data-id");
                DB.database.ref(DB.user.uid + '/hisseler').child(id).remove().then(function () {
                    getHisseler();
                }).then(function () {

                    swal("İşleminiz başarıyle gerçekleşti.", {
                        icon: "success"
                    });
                });
            }
        });
    });
});