<?php

session_start();

require __DIR__.'/vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;


/**
* 
*/
class User
{
		
	private $con;
	private $firebase;

	function __construct()
	{	
		try {
			$this->con = new PDO('mysql:host=localhost;dbname=phpfirebase', 'root', 'root');
			$this->con->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    		$this->con->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
			// This assumes that you have placed the Firebase credentials in the same directory
			// as this PHP file.
			$serviceAccount = ServiceAccount::fromJsonFile(__DIR__.'/ps-chat-c3965-firebase-adminsdk-ylpl2-8cfdc33692.json');

			$this->firebase = (new Factory)
			     ->withServiceAccount($serviceAccount)
			     ->create();
		} catch (PDOException $e) {
			echo 'Exception -> ';
    		var_dump($e->getMessage());
		}
		
	}

	private function getUuid(){
		return $this->con->query("SELECT uuid() as uuid")->fetch()['uuid'];
	}

	private function isExists($table, $key, $value){
		
		try{
			$stmt = $this->con->prepare("SELECT uuid FROM $table WHERE :key = :value LIMIT 1");
		
			$stmt->bindParam(':key', $key, PDO::PARAM_STR);
			$stmt->bindParam(':value', $value, PDO::PARAM_STR);

			$stmt->execute();

			if ($stmt->rowCount() > 0) {
				return array('status'=> 303, 'message'=> $value.' already exists');
			}else{
				return array('status'=> 200, 'message'=> $value);
			}
		}catch(Exception $e){
			return array('status'=>405, 'message'=>$e->getMessage());
		}
		
	}

	public function createAccount($fullname, $username, $email, $password){

		if (empty($fullname) || empty($username) || empty($email) || empty($password)) {
			return array('status'=> 303, 'message'=> 'Empty Fields');
		}else{
			
			$emailResp = $this->isExists('users', 'email', $email);
			if ($emailResp['status'] != 200) {
				return $emailResp;
			}
			
			$usernameResp = $this->isExists('users', 'username', $username);
			if ($usernameResp['status'] != 200) {
				return $usernameResp;
			}

			$password = password_hash($password, PASSWORD_BCRYPT, ['cost'=> 8]);
			$stmt = $this->con->prepare("INSERT INTO `users`(`uuid`, `fullname`, `username`, `email`, `password`) VALUES (:uuid, :fullname, :username , :email, :password)");
			
			$uuid = $this->getUuid();
			
			$stmt->bindParam(':uuid', $uuid, PDO::PARAM_STR);
			$stmt->bindParam(':fullname', $fullname, PDO::PARAM_STR);
			$stmt->bindParam(':username', $username, PDO::PARAM_STR);
			$stmt->bindParam(':email', $email, PDO::PARAM_STR);
			$stmt->bindParam(':password', $password, PDO::PARAM_STR);

			if ($stmt->execute()) {
				return array('status'=> 200, 'message'=> 'Account creatded Successfully..!');
			}else{
				return array('status'=> 303, 'message'=> print_r($stmt->errorInfo()));
			}

		}
		
	}

	public function loginUser($username, $password){

		$stmt = $this->con->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
		$stmt->bindParam(':username', $username, PDO::PARAM_STR);
		$stmt->execute();

		if ($stmt->rowCount() == 1) {
			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if (password_verify($password, $row['password'])) {
				
				$_SESSION['user_uuid'] = $row['uuid'];
				$_SESSION['username'] = $row['username'];
				$_SESSION['fullname'] = $row['fullname'];

				$user_stmt = $this->con->prepare("UPDATE users SET log_in='Online' WHERE uuid='".$row['uuid']."'");
				$user_stmt->execute();

				$ar = [];
				$ar['message'] =  'User Logged in Successfully';
				$ar['user_uuid'] = $row['uuid'];

				$additionalClaims = ['username'=> $row['username'], 'email'=> $row['email']];
				$customToken = $this->firebase->getAuth()->createCustomToken($ar['user_uuid'], $additionalClaims);

				$ar['token'] = (string)$customToken;
				
				return array('status'=> 200, 'message'=> $ar);

			}else{
				return array('status'=> 303, 'message'=> 'Password does not match');
			}
		}else{
			return array('status'=> 303, 'message'=> $username.' does not exists');
		}

	}

	public function createChatRecord($user_1_uuid, $user_2_uuid){

		$chat_uuid_stmt = $this->con->prepare("SELECT chat_uuid FROM chat_record WHERE (user_1_uuid = :user_1_uuid AND user_2_uuid = :user_2_uuid) OR (user_1_uuid = :user_22_uuid AND user_2_uuid = :user_11_uuid) LIMIT 1");
		
		$chat_uuid_stmt->bindParam(":user_1_uuid", $user_1_uuid, PDO::PARAM_STR);
		$chat_uuid_stmt->bindParam(":user_2_uuid", $user_2_uuid, PDO::PARAM_STR);
		$chat_uuid_stmt->bindParam(":user_22_uuid", $user_2_uuid, PDO::PARAM_STR);
		$chat_uuid_stmt->bindParam(":user_11_uuid", $user_1_uuid, PDO::PARAM_STR);

		$chat_uuid_stmt->execute();
		$ar = [];

		if (empty($user_1_uuid) || empty($user_2_uuid)) {
			return  array('status' => 303, 'message'=> 'Invalid details');
		}

		$ar['user_1_uuid'] = $user_1_uuid;
		$ar['user_2_uuid'] = $user_2_uuid;

		$user_stmt = $this->con->prepare("SELECT log_in FROM users WHERE uuid='".$user_2_uuid."'");
		$user_stmt->execute();

		if ($user_stmt->rowCount() == 1) {
			$ar['log_in'] = $user_stmt->fetch(PDO::FETCH_ASSOC)['log_in'];
		} else {
			$ar['log_in'] = 'Offline';
		}

		if ($chat_uuid_stmt->rowCount() == 1) {
			$ar['chat_uuid'] = $chat_uuid_stmt->fetch(PDO::FETCH_ASSOC)['chat_uuid'];
			return array('status'=>200, 'message'=> $ar);
		}else{
			$chat_uuid = $this->getUuid();
			$begin_chat_stmt = $this->con->prepare("INSERT INTO `chat_record`(`chat_uuid`, `user_1_uuid`, `user_2_uuid`) VALUES (:chat_uuid, :user_1_uuid, :user_2_uuid)");
			
			$begin_chat_stmt->bindParam(':chat_uuid', $chat_uuid, PDO::PARAM_STR);
			$begin_chat_stmt->bindParam(':user_2_uuid', $user_1_uuid, PDO::PARAM_STR);
			$begin_chat_stmt->bindParam(':user_1_uuid', $user_2_uuid, PDO::PARAM_STR);
			
			$begin_chat_stmt->execute();
			$ar['chat_uuid'] = $chat_uuid;
			
			return array('status'=> 200, 'message'=> $ar);
		}

	}

	public function getUsers(){
		$query = $this->con->query("SELECT uuid,fullname,username,log_in, (
					SELECT
						chat_uuid
					FROM
						chat_record
					WHERE
						(user_1_uuid = '" . $_SESSION['user_uuid'] . "' AND user_2_uuid = users.uuid)
						OR
						(user_1_uuid = users.uuid AND user_2_uuid = '" . $_SESSION['user_uuid'] . "')
					LIMIT 1
				) as chat_uuid
			FROM users
			WHERE uuid IN (SELECT user_1_uuid as id
				FROM chat_record
				WHERE user_2_uuid = '" . $_SESSION['user_uuid'] . "'
				UNION
				SELECT user_2_uuid as id
				FROM chat_record
				WHERE user_1_uuid = '" . $_SESSION['user_uuid'] . "')");
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['users'=>$ar]);
	}

	public function logout(){

		if (isset($_SESSION['username'])) {
			$user_stmt = $this->con->prepare("UPDATE users SET log_in='Offline' WHERE uuid='".$_SESSION['user_uuid']."'");
			$user_stmt->execute();
			
			unset($_SESSION['username']);
			unset($_SESSION['user_uuid']);
			session_destroy();
			
			return array('status'=>200, 'message'=>'User Logout Successfully');
		}

		return array('status'=>303, 'message'=>'Logout Fail');
	}

	public function searchUser($keyword){
		$query = $this->con->query("SELECT uuid,fullname,username FROM users
			WHERE fullname like '%$keyword%'");
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['users'=>$ar]);
	}

}

?>