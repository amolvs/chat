<?php 
session_start(); 
if (!isset($_SESSION['user_uuid'])) {
	header("location:index.php");
}
?>

<!DOCTYPE html>
<html>
<head>
	<title>Group Chat</title>
	<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
	<!-- Firebase App is always required and must be first -->
	<script src="https://www.gstatic.com/firebasejs/5.7.0/firebase-app.js"></script>
	<!-- Add additional services that you want to use -->
	<script src="https://www.gstatic.com/firebasejs/5.7.0/firebase-auth.js"></script>
	<script src="https://www.gstatic.com/firebasejs/5.7.0/firebase-firestore.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
	<link rel="stylesheet" type="text/css" href="style.css">
</head>
<body>


<div class="main-wrapper">
	<header class="header">
		<div class="logo">
			<a href="#">My Messenger (<?php echo ucwords($_SESSION['fullname']); ?>)</a>
		</div>
		<div class="menu">
			<div class="extra-link">
				<!-- <a href="add-group.php" class="add-group">Add Group</a>&nbsp;&nbsp;&nbsp;
				<a href="add-group-member.php" class="add-group-member">Add Group Member</a> -->
				<button type="button" class="btn btn-info btn-sm add-group" style="margin-right: 10px" data-toggle="modal" data-target="#myAddGroupModal">Add Group</button>
				<div class="modal fade" id="myAddGroupModal" role="dialog">
					<div class="modal-dialog">
						<!-- Modal content-->
						<div class="modal-content">
							<form id="add-group-form" onsubmit="return false">
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal">&times;</button>
									<h4 class="modal-title">Add Group</h4>
								</div>
								<div class="modal-body">
									<input type="text" name="groupname" class="form-control" placeholder="Group Name">
									<input type="hidden" name="add_group" value="1">
								</div>
								<div class="modal-footer">
									<button id="add-group-btn" class="btn btn-info btn-sm">Submit</button>
								</div>
							</form>
						</div>
					</div>
				</div>

				<button type="button" class="btn btn-info btn-sm add-group-member" data-toggle="modal" data-target="#addGroupMemberModel">Add Group Member</button>
				<div class="modal fade" id="addGroupMemberModel" role="dialog">
					<div class="modal-dialog">
						<!-- Modal content-->
						<div class="modal-content">
							<form id="add-group-member-form" onsubmit="return false">
								<div class="modal-header">
									<button type="button" class="close" data-dismiss="modal">&times;</button>
									<h4 class="modal-title">Add Group Member</h4>
								</div>
								<div class="modal-body">
									<input type="text" class="search-user-group form-control" placeholder="Search User">
									<select class="searchUserList form-control" name="newUsers">
										<option>Select User</option>
									</select>
									<div class="show-selected-users"></div>
									<input type="hidden" name="user_uuid" id="user_uuid_arr">
									<input type="hidden" name="group_uuid" id="group_uuid">
									<input type="hidden" name="add_group_member" value="1">
								</div>
								<div class="modal-footer">
									<button id="add-group-member-btn" class="btn btn-info btn-sm">Submit</button>
								</div>
							</form>
						</div>
					</div>
				</div>


				<div class="modal fade" id="memberListModel" role="dialog">
					<div class="modal-dialog">
						<!-- Modal content-->
						<div class="modal-content">
							<div class="modal-header">
								<button type="button" class="close" data-dismiss="modal">&times;</button>
								<h4 class="modal-title"></h4>
							</div>
							<div class="modal-body">
								<ol class="show-user-list"></ol>
							</div>
						</div>
					</div>
				</div>
			</div>

			<a href="chat.php">User Chat&nbsp;<i class="fas fa-user"></i></a>&nbsp;&nbsp;
			<a href="#">Group Chat&nbsp;<i class="fas fa-users"></i></a>&nbsp;&nbsp;
			<a href="#" onclick="logout()">Logout&nbsp;<i class="fas fa-sign-out-alt"></i></a>
		</div>
	</header>	
	<div class="flex-box">
		<div class="box-1">
			<div class="messenger">
				<div class="heading">
					<!-- <i class="fab fa-facebook-messenger"></i>&nbsp;<span>Messenger</span> -->
					<input type="text" class="search-group form-control" placeholder="Search User" />
					<div class="search-groups-list" hidden>
						<select class="groupList">
						</select>
					</div>
				</div>
				<div class="groups">
				</div>
			</div>
		</div>
		<div class="box-2">
			<div class="chat-container">
				<div class="heading">
					<i class="fas fa-user"></i>&nbsp;
					<span class="name"></span>
					<div class="attachment">
						<label for="file-id" class="attchment-icon">
							<i class="fa fa-paperclip"></i>
						</label>
						<input type="file" id="file-id" accept="image/x-png,image/gif,image/jpeg,image/jpg,video/mp4,audio/mp3,audio/wma">
					</div>
				</div>
				<div class="messages">
					<div class="chats">
						<div class="message-container">
							<!--
							<div class="message-block">
								<div class="user-icon"></div>
								<div class="message">Hi, Govardhan hhow are you..?</div>
							</div>
							<div class="message-block received-message" style="">
								<div class="user-icon"></div>
								<div class="message">Hi, Govardhan hhow are you..?</div>
							</div>
							-->
						</div>
					</div>
					<div class="write-message">
						<div class="message-area"> 
							<textarea class="message-input" placeholder="Type a message"></textarea>
							<button class="send-btn"><i class="fab fa-telegram-plane"></i>&nbsp;Send</button>
						</div>
					</div>
					
				</div>
				
			</div>
		</div>
	</div>
</div>

	<script type="text/javascript" src="js/firestore-config.js"></script>
	<script type="text/javascript" src="js/group-chat.js"></script>

</body>
</html>