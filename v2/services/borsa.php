<?php

//header("Access-Control-Allow-Origin", "*");
//header("Access-Control-Allow-Credentials", "true");
//header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
//header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Authorization, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
//header('Content-Type: application/json; charset=utf8');

$url = 'http://graph.foreks.com/grafik/webfx/line3djson.jsp?hisse='.$_GET["hisse"];
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$html = curl_exec($ch);
curl_close($ch);


$index1 = strpos($html,"strong");
if (!empty($index1)) {
    $html = substr($html, $index1-1, 17);
    $html = strip_tags($html);
    echo str_replace(",", ".", $html);
} else {
    echo "0";
}
