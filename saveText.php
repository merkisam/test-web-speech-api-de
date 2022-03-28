<?php

$data = json_decode(file_get_contents('php://input'), true);
$filePath = "uploads/". str_replace(':', '-', date("Y-m-d H:i:s")) .".txt";
file_put_contents($filePath, str_replace('\n', "\n", $data));

?>