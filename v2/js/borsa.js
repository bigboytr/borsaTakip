/**
 * Created by yasin on 13.02.2018.
 */

$(document).ready(function () {

    // User vars
    var token;
    var user;

    // vars
    var satis_yapilan_hisse;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            getHisseler();
            getKademeler();
            getHisseListesi();
        } else {
            window.location = "login.html";
        }
    });

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

    var app = new Vue({
        el: '#borsa',
        data: {
            hisseler: {},
            portfoyDetay: {},
            portfoyDetayKey: ''
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

                    $.get('./services/borsa.php?hisse=' + key, function (price) {

                        //$.get("https://www.doviz.com/api/v1/stocks/"+element.share_code+"/latest", function (data) {

                        data[key]["fiyat"] = price;
                        //});
                    });

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
            pozisyonSatisModal(key) {
                satis_yapilan_hisse = key;
                $("#pozisyon_sat_modal").modal("show");
            },
            portfoyDetayModal(key) {
                this.portfoyDetayKey = key;
                this.portfoyDetay = this.hisseler[key]["portfoy"];
                $("#portfoy_detay_modal").modal("show");
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
            }
        },
        mounted: function() {
            setInterval(this.hisseFiyat, 5000);
        },
        computed: {
            maliyet() {
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
                }
            },
            karZarar() {
                for (key in this.hisseler) {
                    let lot = parseInt(this.hisseler[key]["toplamLot"]);
                    let fiyat = parseFloat(this.hisseler[key]["fiyat"]);
                    let maliyet = parseFloat(this.hisseler[key]["maliyet"]);

                    this.hisseler[key]["karZarar"] = ((lot * fiyat) - maliyet).toFixed(2);
                }
            }
        }
    });

    function getHisseler() {

        DB.database.ref(DB.user.uid + '/hisseler').once('value').then(function (snapshot) {

            app.hisseler = snapshot.val();
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

    $("#save_portfoy").on("click", function () {
        var code = $("#modal_hisse").val();
        var alis = parseFloat($("#modal_hisse_alis").val());
        var komi = parseFloat($("#modal_hisse_komisyon").val());
		var lot = parseInt($("#modal_hisse_lot").val());
        var tarih = $("#modal_hisse_tarih").val();

        DB.database.ref(DB.user.uid + "/hisseler/"+code+"/portfoy").push({
            tip: "alis",
            fiyat: alis,
            lot: lot,
            komisyon: komi,
            tarih: tarih
        }).then(function (result) {

            $("#portfoy_ekle_modal").modal("hide");
            getHisseler();

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

    $('#portfoy_ekle_modal').on('show.bs.modal', function () {

        if (app.hisseler == null) {
            $("#portfoy_ekle_modal").modal("hide");
            alert("Takip edilecek hisse kaydetmeniz gerekiyor.");
            return false;
        }
    });

});

