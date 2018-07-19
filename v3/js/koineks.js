/**
 * Created by yasin on 3.01.2018.
 */
$(document).ready(function () {

    var user_coins;
    var maxChild;

    var btc = {};
    var eth = {};
    var ltc = {};
    var doge = {};
    var coins = {};

    //DOM elements
    var btcNode = $("#btc");
    var ltcNode = $("#ltc");
    var ethNode = $("#eth");
    var dogeNode = $("#doge");

    var btcChangeNode = $("#btc_change");
    var ltcChangeNode = $("#ltc_change");
    var ethChangeNode = $("#eth_change");
    var dogeChangeNode = $("#doge_change");

    var btcHigh = $("#btc_high");
    var btcLow = $("#btc_low");

    var ltcHigh = $("#ltc_high");
    var ltcLow = $("#ltc_low");

    var ethHigh = $("#eth_high");
    var ethLow = $("#eth_low");

    var dogeHigh = $("#doge_high");
    var dogeLow = $("#doge_low");

    // dk da bir veri çek
    getKoineks();
    setInterval(getKoineks, 60000);

    function getKoineks() {

        $.get("./services/koineks.php", function (data) {

            btc = {
                "price": data.BTC.current,
                "high": data.BTC.high,
                "low": data.BTC.low,
                "perc": data.BTC.change_percentage
            };
            eth = {
                "price": data.ETH.current,
                "high": data.ETH.high,
                "low": data.ETH.low,
                "perc": data.ETH.change_percentage
            };
            ltc = {
                "price": data.LTC.current,
                "high": data.LTC.high,
                "low": data.LTC.low,
                "perc": data.LTC.change_percentage
            };
            doge = {
                "price": data.DOGE.current,
                "high": data.DOGE.high,
                "low": data.DOGE.low,
                "perc": data.DOGE.change_percentage
            };

            btcNode.text("").text(btc.price);
            ltcNode.text("").text(ltc.price);
            ethNode.text("").text(eth.price);
            dogeNode.text("").text(doge.price);

            btcChangeNode.text("").text(btc.perc);
            changePercentageColor(btcChangeNode, btc.perc);

            ltcChangeNode.text("").text(ltc.perc);
            changePercentageColor(ltcChangeNode, ltc.perc);

            ethChangeNode.text("").text(eth.perc);
            changePercentageColor(ethChangeNode, eth.perc);

            dogeChangeNode.text("").text(doge.perc);
            changePercentageColor(dogeChangeNode, doge.perc);

            btcHigh.text("").text(btc.high);
            btcLow.text("").text(btc.low);

            ltcHigh.text("").text(ltc.high);
            ltcLow.text("").text(ltc.low);

            ethHigh.text("").text(eth.high);
            ethLow.text("").text(eth.low);

            dogeHigh.text("").text(doge.high);
            dogeLow.text("").text(doge.low);
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

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            getCoins();
        } else {
            window.location = "login.html";
        }
    });

    var globalCoinHTML = new Vue({
        el: "#coin_container",
        template: "#coin-template",
        data: {
            coins: []
        }
    });

    function getCoins() {

        DB.database.ref(DB.user.uid + '/koineks').once('value').then(function (snapshot) {

            obj = [];
            i = 0;

            user_coins = snapshot.val();
            maxChild = snapshot.numChildren() - 1;

            $.each(user_coins, function (index, item) {

                alis = parseFloat(item.alis);
                adet = parseFloat(item.adet);

                //var lotMaliyet = alis * lot;
                var karzarar = 0;

                switch (item.coin) {
                    case "BTC": karzarar = (adet * btc.price) - (adet * alis); break;
                    case "ETH": karzarar = (adet * eth.price) - (adet * alis); break;
                    case "LTC": karzarar = (adet * ltc.price) - (adet * alis); break;
                    case "DOGE": karzarar = (adet * doge.price) - (adet * alis); break;
                }

                obj[i] = {
                    "coin_key": index,
                    "coin": item.coin,
                    "alis": alis,
                    "adet": adet,
                    "karzarar": karzarar
                };

                if (i === maxChild) {
                    globalCoinHTML.coins = obj;
                } else {
                    i++;
                }

            });

            //listElement.innerHTML = html;
        });
    }

    $("#save_coin").on("click", function () {
        var coin = $("#modal_coin").val();
        var alis = $("#modal_coin_alis").val();
        var adet = $("#modal_coin_adet").val();
        var tarih = $("#modal_coin_tarih").val();

        DB.database.ref(DB.user.uid + "/koineks").push({
            coin: coin,
            alis: alis,
            adet: adet,
            tarih: tarih,
            acik: 1
        }).then(function (result) {

            $("#coin_ekle_modal").modal("hide");
            getCoins();

        });
    });

    $("body").on("click", ".coin_sil", function () {

        var id = $(this).attr("data-id");

        DB.database.ref(DB.user.uid + '/koineks').child(id).remove().then(function () {
            getCoins();
        });
    });
});