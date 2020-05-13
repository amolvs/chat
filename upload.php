<?php

/* Getting file name */
$path_parts = pathinfo($_FILES['file']['name']);
$ext = $path_parts['extension'];
$file_name = time().'_'.$path_parts['filename'].'.'.$ext;

/* Location */
$location = "upload/".$file_name;

/* Upload file */
if (move_uploaded_file($_FILES['file']['tmp_name'], $location)) {
	$imageExtentions = ['png', 'gif', 'jpeg', 'jpg'];
	if (in_array($ext, $imageExtentions)) {
		$file_type = 'image';
	} else if ($ext == 'mp4') {
		$file_type = 'video';
	} else if ($ext == 'mp3') {
		$file_type = 'audio';
	}
	// $response['success'] = true;
	// $response['file_name'] = $file_name;
	// $response['file_type'] = $file_type;
	echo $file_name;
} else {
	echo 0;
	// $response['success'] = false;
}

// return $response;

?>