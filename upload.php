<?php

/* Getting file name */
$path_parts = pathinfo($_FILES['file']['name']);
$ext = $path_parts['extension'];
$file_name = time().'_'.$path_parts['filename'].'.'.$ext;

/* Location */
$location = "upload/".$file_name;

/* Upload file */
if (move_uploaded_file($_FILES['file']['tmp_name'], $location)) {
	echo $file_name;
} else {
	echo 0;
}

?>