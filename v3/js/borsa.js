/**
 * Created by yasin on 13.02.2018.
 */

$(document).ready(function () {

    // User vars
    var token;
    var user;

    // vars
    var satis_yapilan_hisse;
    var alis_yapilan_hisse;

    firebase.auth().onAuthStateChanged(function(user) {

        if (user) {

            getHisseListesi();
            getHisseler();

        } else {
            window.location = "login.html";
        }
    });

    /*var globalKademelerHTML = new Vue({
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
    });*/

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

    var app = new Vue({
        el: '#borsa',
        data: {
            hisseler: {},
            portfoyDetay: {},
            portfoyDetayKey: '',
            portfoyDetayTitle: '',
            toplamMaliyetValue: 0,
            toplamKarZararValue: 0,
            yekun: 0
        },
        methods: {
            hedefKazanc(key) {
                let lot = this.hisseler[key]["toplamLot"];
                let sat = parseFloat(this.hisseler[key]["hedefSatis"]);
                if (sat > 0) {
                    this.hisseler[key]["hedefKazanc"] = ((this.hisseler[key]["hedefSatis"] * this.hisseler[key]["toplamLot"]) - this.hisseler[key]["maliyet"]).toFixed(2);
                } else {
                    this.hisseler[key]["hedefKazanc"] = 0;
                }
            },
            hedefKazancKaydet(key) {
                DB.database.ref(DB.user.uid + "/hisseler/"+key).update({
                    "hedefSatis": this.hisseler[key]["hedefSatis"],
                    "hedefKazanc": this.hisseler[key]["hedefKazanc"]
                }).then(function (result) {

                });

            },
            indicator(key) {
                let hesap = this.hisseler[key]["karZarar"];

                if (hesap > 0)
                    return 'green';
                else if (hesap < 0)
                    return 'red';
                else
                    return '';
            },
            icon(key) {
                let hesap = this.hisseler[key]["karZarar"];

                if (hesap > 0)
                    return 'fas fa-arrow-up pull-right';
                else if (hesap < 0)
                    return 'fas fa-arrow-down pull-right';
                else
                    return 'fas fa-minus pull-right';
            },
            hisseFiyat() {
                let data = this.hisseler; // we must create this var because "this" is restricted by JQ.

                $.each(this.hisseler, function (key, item) {

                    let hisse_price = 0;

                    $.get('./services/borsa.php?hisse=' + key, function (price) {

                        if (price !== "0") {
                            data[key]["fiyat"] = price;
                            hisse_price = parseFloat(price);
                        }
                    });

                    /*$.get('./services/bistStock.php?hisse=' + key, function (returning) {

                        let response = (JSON).parse(returning);
                        data[key]["gunDusuk"] = parseFloat(response.lowest).toFixed(2);
                        data[key]["gunYuksek"] = parseFloat(response.highest).toFixed(2);

                        if (hisse_price === 0){
                            // anlık değer 0 TL geldiyse doviz.comdan veriyi alıyoruz.
                            // Muhtemelen 15dklık gecikmeli veridir.
                            data[key]["fiyat"] = parseFloat(response.latest).toFixed(2);
                        }
                    });*/

                });
            },
            pozisyonSatis() {

                var fiyat = parseFloat($("#modal_hisse_satis").val());
                var komi = parseFloat($("#modal_hisse_sat_komisyon").val());
                var lot = parseInt($("#modal_hisse_sat_lot").val());
                var tarih = $("#modal_hisse_sat_tarih").val();

                komi = isNaN(komi) ? 0 : komi;
                fiyat = isNaN(fiyat) ? 0 : fiyat;
                lot = isNaN(lot) ? 0 : lot;

                if (fiyat > 0 && lot > 0) {
                    DB.database.ref(DB.user.uid + "/hisseler/"+satis_yapilan_hisse+"/portfoy").push({
                        tip: "satis",
                        fiyat: fiyat,
                        lot: lot,
                        komisyon: komi,
                        tarih: tarih
                    }).then(function (result) {

                        $("#pozisyon_sat_modal").modal("hide");
                        getHisseler();

                    });
                }
            },
            pozisyonEkleModal(key) {
                alis_yapilan_hisse = key;
                $("#pozisyonEkle_baslik").text(this.hisseler[key].baslik);
                $("#portfoy_ekle_modal").modal("show");
            },
            pozisyonSatisModal(key) {
                satis_yapilan_hisse = key;
                $("#pozisyon_sat_modal").modal("show");
            },
            portfoyDetayModal(key) {
                this.portfoyDetayKey = key;
                this.portfoyDetay = this.hisseler[key]["portfoy"];
                this.portfoyDetayTitle = this.hisseler[key]["baslik"];
                this.durum();
                $("#portfoy_detay_modal").modal("show");
            },
            pozisyonEkle() {
                var alis = parseFloat($("#modal_hisse_alis").val());
                var komi = parseFloat($("#modal_hisse_komisyon").val());
                var lot = parseInt($("#modal_hisse_lot").val());
                var tarih = $("#modal_hisse_tarih").val();

                DB.database.ref(DB.user.uid + "/hisseler/"+alis_yapilan_hisse+"/portfoy").push({
                    tip: "alis",
                    fiyat: alis,
                    lot: lot,
                    komisyon: komi,
                    tarih: tarih
                }).then(function (result) {

                    $("#portfoy_ekle_modal").modal("hide");
                    getHisseler();

                });
            },
            pozisyonMaliyet(lot, fiyat) {
                return parseFloat(lot * fiyat).toFixed(2);
            },
            pozisyonSil(id) {
                let portDetayKey = this.portfoyDetayKey;
                swal({
                    title: "Pozisyon Sil !",
                    text: "Portföyünüzdeki pozisyon silinecek, devam edilsin mi ?",
                    icon: "warning",
                    buttons: ["Vazgeç", "Tamam"],
                    dangerMode: true

                }).then(function (response) {

                    if (response) {

                        DB.database.ref(DB.user.uid + "/hisseler/"+portDetayKey+"/portfoy").child(id).remove().then(function () {
                            getHisseler();
                        }).then(function () {
                            $("#portfoy_detay_modal").modal("hide");
                            swal("İşleminiz başarıyle gerçekleşti.", {
                                icon: "success"
                            });
                        });
                    }
                });
            },
            hisseSil(key) {
                swal({
                    title: "Hisse Sil !",
                    text: "Hisse takip listesinden çıkarılacak, devam edilsin mi ?",
                    icon: "warning",
                    buttons: ["Vazgeç", "Tamam"],
                    dangerMode: true

                }).then(function (response) {

                    if (response) {

                        DB.database.ref(DB.user.uid + '/hisseler/').child(key).remove().then(function () {
                            getHisseler();
                        }).then(function () {
                            swal("İşleminiz başarıyle gerçekleşti.", {
                                icon: "success"
                            });
                        });
                    }
                });
            },
            durum() {
                let alislar = 0;
                let satislar = 0;
                let top = 0;
                let key = this.portfoyDetayKey;

                for (key2 in this.hisseler[key]["portfoy"]) {

                    let item = this.hisseler[key]["portfoy"][key2];

                    let lot = parseInt(item["lot"]);
                    let fiyat = parseFloat(item["fiyat"]);
                    let hesap = lot * fiyat;

                    switch (item["tip"]) {
                        case "alis" : top -= hesap; break;//alislar += hesap; break;
                        case "satis": top += hesap; break; //satislar += hesap; break;
                    }
                }

                //this.yekun = parseFloat(alislar - satislar).toFixed(2);
                this.yekun = top.toFixed(2);
            }
        },
        mounted: function() {
            setInterval(this.hisseFiyat, 5000);
        },
        computed: {
            maliyet() {
                this.toplamMaliyetValue = 0;
                for (var key in this.hisseler) {
                    let aort = 0;
                    let topLot = 0;
                    for (var key2 in this.hisseler[key]["portfoy"]) {

                        let lot = parseInt(this.hisseler[key]["portfoy"][key2]["lot"]);
                        let alis = parseFloat(this.hisseler[key]["portfoy"][key2]["fiyat"]);
                        let hesapla = lot * alis;

                        switch(this.hisseler[key]["portfoy"][key2]["tip"]) {

                            case "alis": {aort += parseFloat(hesapla); topLot += parseInt(lot); } break;
                            case "satis": {
                                topLot -= parseInt(lot);

                                aort = (topLot === 0) ? 0 :  aort - parseFloat(hesapla);
                            } break;
                        }
                    }
                    this.hisseler[key]["maliyet"] = aort.toFixed(2);
                    this.hisseler[key]["alisOrt"] = (aort / topLot).toFixed(2);
                    this.hisseler[key]["toplamLot"] = topLot;

                    if (topLot > 0){
                        this.toplamMaliyetValue = (parseFloat(this.toplamMaliyetValue) + parseFloat(aort)).toFixed(2);
                    }
                }
            },
            karZarar() {
                this.toplamKarZararValue = 0;
                for (key in this.hisseler) {
                    let lot = parseInt(this.hisseler[key]["toplamLot"]);
                    let fiyat = parseFloat(this.hisseler[key]["fiyat"]);
                    let maliyet = parseFloat(this.hisseler[key]["maliyet"]);

                    let yekun = parseFloat((lot * fiyat) - maliyet).toFixed(2);
                    this.hisseler[key]["karZarar"] = yekun;

                    if (lot > 0) {
                        this.toplamKarZararValue = (parseFloat(this.toplamKarZararValue) + parseFloat(yekun)).toFixed(2);
                    }
                }
            },
            detayKarZarar() {

            }
        }
    });

    function getHisseler() {

        DB.database.ref(DB.user.uid + '/hisseler').once('value').then(function (snapshot) {

            app.hisseler = snapshot.val();

            $.each(app.hisseler, function (key, item) {

                let link = hisseListesiHTML.hisse_listesi[key]["kademe_link"];
                item["kademe_link"] = link == undefined ? "" : link;

            });
        });
    }


    function getHisseListesi() {
        DB.database.ref('hisse_listesi').once('value').then(function (snapshot) {

            hisseListesiHTML.hisse_listesi = snapshot.val();
        });
    }

    $("#save_hisse").on("click", function () {
        var title = $("#hisse_takip").find(":selected").text();
        var code = $("#hisse_takip").find(":selected").val();

        DB.database.ref(DB.user.uid + "/hisseler/"+code).set({
            "baslik": title,
            "fiyat": 0,
            "toplamLot": 0,
            "alisOrt": 0,
            "maliyet": 0,
            "karZarar": 0,
            "hedefSatis": 0,
            "hedefKazanc": 0
        }).then(function (result) {

            $("#hisse_ekle_modal").modal("hide");
            getHisseler();
        });
    });

/*    $("#save_kademe").on("click", function () {
        var title = $("#kademe_title").val();
        var link = $("#kademe_link").val();

        DB.database.ref("kademeler").push({
            kademe_title: title,
            kademe_link: link
        }).then(function (result) {
            $("#kademe_ekle_modal").modal("hide");
            getKademeler();
        });
    });*/


    // ---------------------------------------- //
    var bist_100 = $("#bist_100");
    var bist_change = $("#bist_change");
    var bist_high = $("#bist_high");
    var bist_low = $("#bist_low");

    var dolar = $("#dolar");
    var dolar_change = $("#dolar_change");
    var euro = $("#euro");
    var euro_change = $("#euro_change");

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

    // BIST100 verisi
    function bist100data() {

        $.get('./services/bist100.php', function (bist) {

            bist = (JSON).parse(bist);

            bist_100.text("").text(parseInt(bist.latest));
            bist_high.text("").text(parseInt(bist.first_seance_highest));
            bist_low.text("").text(parseInt(bist.first_seance_lowest));
            bist_change.text("").text(bist.change_rate.toFixed(2)+" %");

            changePercentageColor(bist_change, bist.change_rate.toFixed(2));
        });

    }

    // Döviz verisi
    function dovizData() {

        $.get('./services/dolar.php', function (veri) {

            veri = (JSON).parse(veri);

            let dolarPerc = (veri[0].dailyChangePercentage * 100).toFixed(2);
            let euroPerc = (veri[1].dailyChangePercentage * 100).toFixed(2);

            //dolar
            dolar.text("").text(veri[0].sellPrice.toFixed(4) + " ₺");
            dolar_change.text("").text(dolarPerc+" %");

            changePercentageColor(dolar_change, dolarPerc);

            // euro
            euro.text("").text(veri[1].sellPrice.toFixed(4) + " ₺");
            euro_change.text("").text(euroPerc+" %");

            changePercentageColor(euro_change, euroPerc);
        });
    }

    /*setInterval(bist100data, 20000);


    bist100data();
    */

  //setInterval(dovizData, 10000);
  //dovizData();
});

