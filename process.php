<?php
/*

CREATE DATABASE phpfirebase;

CREATE TABLE IF NOT EXISTS phpfirebase.users (
	id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    log_in VARCHAR(10) NOT NULL DEFAULT `Offline`,
    UNIQUE KEY (uuid, username)
);

CREATE TABLE `chat_record`(
    `chat_uuid` VARCHAR(36) NOT NULL,
    `user_1_uuid` VARCHAR(36) NOT NULL,
    `user_2_uuid` VARCHAR(36) NOT NULL,
    UNIQUE KEY (chat_uuid)
);

*/
ini_set('display_errors', 1);
require __DIR__.'/User.php';
require __DIR__.'/Group.php';


/* Gereric Functions Start */
//Create new account
if (isset($_POST['register_user']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$user = new User();
	$fullname = $_POST['fullname'];
	$username = $_POST['username'];
	$email = $_POST['email'];
	$password = $_POST['password'];

	//user input validation required here -- start

	//user input validation required here -- end

	$resp = $user->createAccount($fullname, $username, $email, $password);
	echo json_encode($resp);
	exit();
}

//Login User
if (isset($_POST['login_user']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$user = new User();
	$username = $_POST['username'];
	$password = $_POST['password'];

	//user input validation required here -- start

	//user input validation required here -- end

	$resp = $user->loginUser($username, $password);
	echo json_encode($resp);
	exit();
}

if (isset($_POST['logoutUser'])) {
	$user = new User();
	$resp = $user->logout();
	echo json_encode($resp);
	exit();
}
/* Gereric Functions End */


/* User Chat Functions Start */
if (isset($_POST['getUsers']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$user = new User();
	echo json_encode($user->getUsers());
	exit();
}

if (isset($_POST['connectUser']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$user = new User();
	echo json_encode($user->createChatRecord($_POST['user_1'], $_POST['user_2']));
	exit();
}

if (isset($_POST['searchUser']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$user = new User();
	echo json_encode($user->searchUser($_POST['keyword']));
	exit();
}
/* User Chat Functions End */

/* Group Chat Functions Start */
if (isset($_POST['getGroups']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	echo json_encode($group->getGroups());
	exit();
}

//Create new group account
if (isset($_POST['add_group']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	$groupname = $_POST['groupname'];

	//user input validation required here -- start

	//user input validation required here -- end

	$resp = $group->createGroupAccount($groupname);
	echo json_encode($resp);
	exit();
}

if (isset($_POST['searchUserGroup']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	echo json_encode($group->searchUserGroup($_POST['keyword'], $_POST['group_uuid']));
	exit();
}

//Add new group member
if (isset($_POST['add_group_member']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	$group_uuid = $_POST['group_uuid'];
	$user_uuid = $_POST['user_uuid'];

	//user input validation required here -- start

	//user input validation required here -- end

	$resp = $group->addGroupMember($group_uuid, $user_uuid);
	echo json_encode($resp);
	exit();
}

if (isset($_POST['searchGroup']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	echo json_encode($group->searchGroup($_POST['keyword']));
	exit();
}

if (isset($_POST['getGroupMemberList']) && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$group = new Group();
	echo json_encode($group->getGroupMemberList($_POST['group_uuid']));
	exit();
}
/* Group Chat Functions End */

?>