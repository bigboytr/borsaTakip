<?php
/**
 * Created by PhpStorm.
 * User: yasin
 * Date: 13.07.2018
 * Time: 14:07
 */

$url = 'https://www.doviz.com/api/v1/indexes/XU100/latest';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$html = curl_exec($ch);
curl_close($ch);


print_r($html);
