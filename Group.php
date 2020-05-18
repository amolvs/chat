<?php

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require __DIR__.'/vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;


/**
* 
*/
class Group
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

	private function isGroupMemberExists($group_uuid, $user_uuid){
		try{
			$stmt = $this->con->prepare("SELECT * FROM group_members WHERE group_uuid = :group_uuid AND member_uuid = :member_uuid LIMIT 1");
		
			$stmt->bindParam(':group_uuid', $group_uuid, PDO::PARAM_STR);
			$stmt->bindParam(':member_uuid', $user_uuid, PDO::PARAM_STR);

			$stmt->execute();

			if ($stmt->rowCount() > 0) {
				return array('status'=> 303, 'message'=> 'User already exists in this group');
			}else{
				return array('status'=> 200, 'message'=> 'User not exists in this group');
			}
		}catch(Exception $e){
			return array('status'=>405, 'message'=>$e->getMessage());
		}
	}

	public function addGroupMember($group_uuid, $user_uuid){
		$arr_user_uuid = explode(',', $user_uuid);

		$added_on = date('Y-m-d');
		foreach ($arr_user_uuid as $value) {
			$userExistResp = $this->isGroupMemberExists($group_uuid, $value);
			if ($userExistResp['status'] == 200) {
				$group_member_stmt = $this->con->prepare("INSERT INTO `group_members`(`group_uuid`, `member_uuid`, `added_on`) VALUES (:group_uuid, :member_uuid, :added_on)");
				$group_member_stmt->bindParam(':group_uuid', $group_uuid, PDO::PARAM_STR);
				$group_member_stmt->bindParam(':member_uuid', $value, PDO::PARAM_STR);
				$group_member_stmt->bindParam(':added_on', $added_on, PDO::PARAM_STR);
				$group_member_stmt->execute();
			}
		}

		return array('status'=> 200, 'message'=> "Group Members Added Successfully");
	}

	public function createGroupAccount($group_name){
		$user_uuid = $_SESSION['user_uuid'];
		if (empty($group_name) || empty($user_uuid)) {
			return array('status'=> 303, 'message'=> 'Empty Fields');
		}else{
			$group_uuid = $this->getUuid();
			$created_on = date('Y-m-d');

			$groups_stmt = $this->con->prepare("INSERT INTO `groups`(`group_uuid`, `group_name`, `created_on`, `created_by`) VALUES (:group_uuid, :group_name, :created_on, :created_by)");
			$groups_stmt->bindParam(':group_uuid', $group_uuid, PDO::PARAM_STR);
			$groups_stmt->bindParam(':group_name', $group_name, PDO::PARAM_STR);
			$groups_stmt->bindParam(':created_on', $created_on, PDO::PARAM_STR);
			$groups_stmt->bindParam(':created_by', $user_uuid, PDO::PARAM_STR);
			$groups_stmt->execute();
			
			$this->addGroupMember($group_uuid, $user_uuid);

			return array('status'=> 200, 'message'=> "'$group_name' Group Created Successfully");
		}
	}

	public function getGroups(){
		$query = $this->con->query("SELECT group_uuid, group_name, created_by
			FROM groups
			WHERE group_uuid IN (
				SELECT DISTINCT(group_uuid)
				FROM group_members
				WHERE member_uuid = '". $_SESSION['user_uuid'] ."')");
		
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['groups'=>$ar]);
	}

	public function searchUserGroup($keyword, $group_uuid){
		$query = $this->con->query("SELECT uuid,fullname,username
			FROM users
			WHERE fullname like '%$keyword%'
				AND uuid NOT IN (SELECT member_uuid
					FROM group_members
					WHERE group_uuid = '".$group_uuid."')");
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['users'=>$ar]);
	}

	public function searchGroup($keyword){
		$query = $this->con->query("SELECT group_uuid, group_name
			FROM groups
			WHERE group_name like '%$keyword%'
				AND group_uuid IN (
					SELECT DISTINCT(group_uuid)
					FROM group_members
					WHERE member_uuid = '". $_SESSION['user_uuid'] ."')");
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['groups'=>$ar]);
	}

	public function getGroupMemberList($group_uuid){
		$query = $this->con->query("SELECT uuid,fullname,username
			FROM users
			WHERE uuid IN (SELECT member_uuid
					FROM group_members
					WHERE group_uuid = '".$group_uuid."')");
		$ar = [];
		while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
			$ar[] = $row;
		}

		return array('status'=>200, 'message'=>['groupMembers'=>$ar]);
	}
}

?>