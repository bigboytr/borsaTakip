<?php
/**
 * Created by PhpStorm.
 * User: yasin
 * Date: 4.01.2018
 * Time: 20:29
 */

header('Content-Type: application/json; charset=utf8');

echo $content = file_get_contents("https://koineks.com/ticker");