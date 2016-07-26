<?php
// Get the results parameter from URL
//$results = $_POST['results'];

//$resultsFile = fopen('results.csv', 'a') or die('Unable to open file!');
//fwrite($resultsFile, $results);
//fclose($resultsFile);

$testFile = fopen('test.txt', 'w') or die('Unable to open file!');
fwrite($testFile, "this is only a test");
fclose($testFile);
?>
