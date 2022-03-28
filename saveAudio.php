<?php

$input = $_FILES['audio_data']['tmp_name'];
$filePath = "uploads/". str_replace(':', '-', date("Y-m-d H:i:s")) .".wav";
move_uploaded_file($input, $filePath);

?>