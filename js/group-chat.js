var chat_data = {}, user_uuid, chatHTML = '', group_uuid = "", groupList = [], userRef = '', selectedUserList = [], groupMemberList = [];

	$(".attachment").hide();
	$(".add-group").show();
	$(".add-group-member").hide();

	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			user_uuid = user.uid;
			getGroups();
		} else {
			// console.log("Not sign in");
		}
	});


	function logout() {
		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {logoutUser:1},
			success : function(response) {
				firebase.auth().signOut().then(function() {
					window.location.href = "index.php";
				}).catch(function(error) {
					// An error happened.
					// console.log('Logout Fail');
				});
			}
		});
	}


	$("#add-group-btn").on('click', function(e){
		e.preventDefault();
		var btnHTML = $(this).html();
		$(this).html("<img id='loader' src='images/loader.svg' alt='Loading...!' />");

		$.ajax({
			url : './process.php',
			method : 'POST',
			data : $("#add-group-form").serialize(),
			success : function(response){
				var resp = JSON.parse(response);
				if (resp.status == 200) {
					alert(resp.message);
					window.location.href = "group-chat.php";
				}
			},
			error : function(er){
				// console.log(er);
			}
		});
	});


	$("#add-group-member-btn").on('click', function(e){
		e.preventDefault();
		var btnHTML = $(this).html();
		// $(this).html("<img id='loader' src='images/loader.svg' alt='Loading...!' />");
		$("#user_uuid_arr").val(selectedUserList);
		$("#group_uuid").val(group_uuid);

		$.ajax({
			url : './process.php',
			method : 'POST',
			data : $("#add-group-member-form").serialize(),
			success : function(response){
				var resp = JSON.parse(response);
				if (resp.status == 200) {
					alert(resp.message);
					window.location.href = "group-chat.php";
				} else {
					alert(resp.message);
				}
			},
			error : function(er){
				// console.log(er);
			}
		});
	});


	function getGroups() {
		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {getGroups:1},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					var groups = resp.message.groups;
					var groupsHTML = '';
					$(".groups").html(groupsHTML);
					$.each(groups, function(index, value) {
						groupsHTML = '<div class="group" group_uuid="'+value.group_uuid+'">'+
										'<div class="group-image"></div>'+
										'<div class="group-details">'+
											'<span>'+
												'<strong>'+value.group_name+'</strong>'+
												// '<span class="count">'+unreadCount+'</span>'+
											'</span>'+
										'</div>'+
									'</div>';

						$(".groups").append(groupsHTML);
						groupList.push({group_uuid: value.group_uuid, group_name: value.group_name});

						/*db.collection('chat')
							.where('chat_uuid', '==', value.chat_uuid)
							.where('user_2_uuid', '==', user_uuid)
							.where('view_status', '==', 0)
							.get()
							.then(function(querySnapshot){
								var unreadCount = querySnapshot.size;
								if (unreadCount == 0 || value.uuid == userRef) {
									if (value.uuid == userRef)
										userRef = '';

									groupsHTML = '<div class="user" uuid="'+value.uuid+'">'+
										'<div class="user-image"></div>'+
										'<div class="user-details">'+
											'<span>'+
												'<strong>'+value.fullname+'</strong>'+
											'</span>'+
											loginStatus+
										'</div>'+
									'</div>';
								} else {
									groupsHTML = '<div class="user" uuid="'+value.uuid+'">'+
											'<div class="user-image"></div>'+
											'<div class="user-details">'+
												'<span>'+
													'<strong>'+value.fullname+'</strong>'+
													'<span class="count">'+unreadCount+'</span>'+
												'</span>'+
												loginStatus+
											'</div>'+
										'</div>';
								}
								$(".users").append(groupsHTML);
							});*/
					});
				}else{
					// console.log(response.message);
				}
			}
		});
	}


	$(document.body).on('click', '.group', function() {
		var name = $(this).find("strong").text();
		group_uuid = $(this).attr('group_uuid');
		getGroupMemberList(group_uuid);
		$('.message-container').html('Connecting...!');

		$(".name").text(name);
		$(".attachment").show();
		$(".add-group-member").show();
		$(".add-group").hide();

		chat_data = {
			group_uuid : group_uuid,
			user_uuid : user_uuid
		};
		$('.message-container').html('Say Hi in group - '+name);

		realTime();
	});


	$(".send-btn").on('click', function() {
		var message = $(".message-input").val();
		if (message != "") {
			// var msgs = [];
			var time = new Date();
			var timestamp = time.getTime();
			var data;
			var message_uuid = user_uuid+'-'+timestamp;

			$.each(groupMemberList, function(index, value){
				/*msgs.push({
					group_uuid : chat_data.group_uuid,
					message : message,
					user_1_uuid : user_uuid,
					user_2_uuid : value.uuid,
					view_status : (user_uuid == value.uuid) ? 1 : 0,
					message_type : 'text',
					time : time,
				});*/
				data = {
					group_uuid : chat_data.group_uuid,
					message_uuid : message_uuid,
					message : message,
					user_1_uuid : user_uuid,
					user_2_uuid : value.uuid,
					view_status : (user_uuid == value.uuid) ? 1 : 0,
					message_type : 'text',
					time : time,
				};

				db.collection('group-chat').add(data);
			});
			/*if (msgs.length == 0) {
				return;
			}*/

			/*db.collection('group-chat')
				.add(msgs)
				.then(function(docRef) {
					$(".message-input").val("");
				})
				.catch(function(error) {
					// console.error("Error adding document: ", error);
				});*/
		}
	});


	var newMessage = '';
	function realTime() {
		db.collection('group-chat')
			.where('group_uuid', '==', chat_data.group_uuid)
			.where('user_2_uuid', '==', user_uuid)
			.orderBy('time')
			.onSnapshot(function(snapshot) {
				newMessage = '';
				snapshot.docChanges().forEach(function(change) {
					if (change.doc.data().group_uuid != chat_data.group_uuid) {
						return true;
					}

					if (change.doc.data().user_2_uuid != user_uuid) {
						console.log('this msg is not related to me');
						return true;
					}

					if (change.type === "added") {
						var myDate = new Date(1000 * change.doc.data().time.seconds);
						var month = myDate.getMonth()+1;
						var day = myDate.getDate();
						var viewDate = (day<10 ? '0' : '') + day + '/' + (month<10 ? '0' : '') + month + '/' + myDate.getFullYear();
						
						var hours = myDate.getHours();
						var minutes = myDate.getMinutes();
						var ampm = hours >= 12 ? 'PM' : 'AM';
						hours = hours % 12;
						hours = hours ? hours : 12; // the hour '0' should be '12'
						minutes = minutes < 10 ? '0'+minutes : minutes;
						var strTime = hours + ':' + minutes + ' ' + ampm;
						var divStrTime = '<div class="message-time">'+ strTime +'</div>';
						var senderName = '';
						var rightMsg = '';

						if (change.doc.data().user_1_uuid == user_uuid) {
							msgStart = '<div class="message-block received-message" id="'+change.doc.id+'">';
							rightMsg = '<div class="right-msg-icon"></div>';
						} else {
							senderName = getGroupMemberName(change.doc.data().user_1_uuid);
							senderName = '<p class="send-name">'+senderName+'</p>';
							msgStart = '<div class="message-block left-msg" id="'+change.doc.id+'">'+
								'<div class="left-msg-icon"></div>';
						}

						var actualMessage = '';
						if (change.doc.data().message_type == 'text') {
							actualMessage = change.doc.data().message;
						} else {
							var url = 'upload/' + change.doc.data().message;
							if (fileExists(url)) {
								if (change.doc.data().message_type == 'image') {
									actualMessage = '<img src="upload/'+change.doc.data().message+'" width="200" height="200">';
								} else if (change.doc.data().message_type == 'video') {
									actualMessage = '<video width="320" height="240" controls>'+
										'<source src="upload/'+change.doc.data().message+'" type="video/mp4">'+
									'</video>';
								} else if (change.doc.data().message_type == 'audio') {
									actualMessage = '<audio controls>'+
										'<source src="upload/'+change.doc.data().message+'" type="audio/mpeg">'+
									'</audio>';
								}
							} else {
								actualMessage = 'file not found';
							}
						}

						if($("#" + change.doc.id).length == 0) {
							newMessage	+=	msgStart+
											// userIcon+
											'<div class="message">'+
												senderName+
												actualMessage+
												divStrTime+
											'</div>'+
											rightMsg+
										'</div>';
						}
						if (change.doc.data().user_2_uuid == user_uuid) {
							db.collection("group-chat").doc(change.doc.id).update({view_status: 1});
						}
					}
					if (change.type === "modified") {
					}
					if (change.type === "removed") {
					}

				});
				if (chatHTML != newMessage) {
					$('.message-container').append(newMessage);
				}

				$(".chats").scrollTop($(".chats")[0].scrollHeight);
			});
	}


	/*var newMessage = '';
	function realTime() {
		db.collection('chat')
			.where('chat_uuid', '==', chat_data.chat_uuid)
			.orderBy('time')
			.onSnapshot(function(snapshot) {
				newMessage = '';
				// var userIcon = '<div class="user-icon"></div>';
				snapshot.docChanges().forEach(function(change) {
					if (change.doc.data().chat_uuid != chat_data.chat_uuid) {
						return true;
					}
					if (change.type === "added") {
						var myDate = new Date(1000 * change.doc.data().time.seconds);
						var month = myDate.getMonth()+1;
						var day = myDate.getDate();
						var viewDate = (day<10 ? '0' : '') + day + '/' + (month<10 ? '0' : '') + month + '/' + myDate.getFullYear();
						
						var hours = myDate.getHours();
						var minutes = myDate.getMinutes();
						var ampm = hours >= 12 ? 'PM' : 'AM';
						hours = hours % 12;
						hours = hours ? hours : 12; // the hour '0' should be '12'
						minutes = minutes < 10 ? '0'+minutes : minutes;
						var strTime = hours + ':' + minutes + ' ' + ampm;

						var actualMessage = '';
						if (change.doc.data().message_type == 'text') {
							actualMessage = change.doc.data().message;
						} else {
							var url = 'upload/' + change.doc.data().message;
							if (fileExists(url)) {
								if (change.doc.data().message_type == 'image') {
									actualMessage = '<img src="upload/'+change.doc.data().message+'" width="200" height="200">';
								} else if (change.doc.data().message_type == 'video') {
									actualMessage = '<video width="320" height="240" controls>'+
										'<source src="upload/'+change.doc.data().message+'" type="video/mp4">'+
									'</video>';
								} else if (change.doc.data().message_type == 'audio') {
									actualMessage = '<audio controls>'+
										'<source src="upload/'+change.doc.data().message+'" type="audio/mpeg">'+
									'</audio>';
								}
							} else {
								actualMessage = 'file not found';
							}
						}


						var readStatus = '';
						if (change.doc.data().user_1_uuid == user_uuid) {
							msgStart = '<div class="message-block received-message" id="'+change.doc.id+'">';
							if (change.doc.data().view_status)
								readStatus = '<i class="fa fa-check-double read-status"></i>';
							else
								readStatus = '<i class="fa fa-check read-status"></i>';
							// readStatus = '<i class="fa fa-check read-status"></i>';
						} else {
							msgStart = '<div class="message-block" id="'+change.doc.id+'">';
						}
						var divStrTime = '<div class="message-time">'+ strTime + readStatus +'</div>';

						if($("#" + change.doc.id).length == 0) {
							newMessage	+=	msgStart+
											// userIcon+
											'<div class="message">'+
												actualMessage+
												divStrTime+
											'</div>'+
										'</div>';
						}
						if (change.doc.data().user_2_uuid == user_uuid) {
							db.collection("chat").doc(change.doc.id).update({view_status: 1});
						}
					}
					if (change.type === "modified") {
						if (change.doc.data().user_1_uuid == user_uuid) {
							$("#"+change.doc.id).find(".read-status").removeClass("fa-check");
							$("#"+change.doc.id).find(".read-status").addClass("fa-check-double");
							return true;
						}
					}
					if (change.type === "removed") {
					}
				});

				if (chatHTML != newMessage) {
					$('.message-container').append(newMessage);
				}

				$(".chats").scrollTop($(".chats")[0].scrollHeight);
			});
	}*/


	$(".search-user-group").keyup(function() {
		var searchTxt = $(".search-user-group").val();
		// $(".search-users-list").hide();
		if (searchTxt == '')
			return;
		// $(".search-users-list").show();
		$(".attachment").show();

		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {searchUserGroup: 1, keyword: searchTxt, group_uuid: group_uuid},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					var users = resp.message.users;
					var usersListHTML = '';
					usersListHTML += '<option value="">Select User</option>';
					$.each(users, function(index, value) {
						usersListHTML += '<option value="'+value.uuid+'">'+
										value.fullname+
									'</option>';
						// groupList.push({user_uuid: value.uuid, username: value.username});
					});

					$(".searchUserList").html(usersListHTML);

				} else {
					// console.log(response.message);
				}
			}
		});
	});


	$("select.searchUserList").change(function() {
		var user_uuid = $(this).children("option:selected").val();
		var user_name = $(this).children("option:selected").text();

		if (jQuery.inArray(user_uuid, selectedUserList) !== -1) {
			alert('this user already added');
		} else {
			$(".show-selected-users").append(user_name+',');
			selectedUserList.push(user_uuid);
		}
		$('select.searchUserList').val('');
	});


	$(".search-group").keyup(function() {
		var searchTxt = $(".search-group").val();
		$(".search-groups-list").hide();
		if (searchTxt == '')
			return;
		$(".search-groups-list").show();
		$(".attachment").show();

		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {searchGroup: 1, keyword: searchTxt},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					var groups = resp.message.groups;
					var groupsListHTML = '';
					groupsListHTML += '<option value="">Select Group</option>';
					$.each(groups, function(index, value) {
						groupsListHTML += '<option value="'+value.group_uuid+'">'+
											value.group_name+
										'</option>';

						// userList.push({user_uuid: value.uuid, username: value.username});
					});

					$(".groupList").html(groupsListHTML);

				} else {
					// console.log(response.message);
				}
			}
		});
	});


	$("select.groupList").change(function() {
		var group_uuid = $(this).children("option:selected").val();
		if (group_uuid == '')
			return;
		getGroupMemberList(group_uuid);

		$(".search-groups-list").hide();
		$(".search-group").val('');
		var name = $(this).children("option:selected").text();
		$('.message-container').html('Connecting...!');

		$(".name").text(name);
		$(".attachment").show();
		$(".add-group-member").show();
		$(".add-group").hide();

		chat_data = {
			group_uuid : group_uuid,
			user_uuid : user_uuid
		};
		$('.message-container').html('Say Hi in group - '+name);

		realTime();
	});


	function getGroupMemberList(group_uuid){
		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {getGroupMemberList: 1, group_uuid: group_uuid},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					groupMemberList = resp.message.groupMembers;
				} else {
					// console.log(response.message);
				}
			}
		});
	}


	function getGroupMemberName(user_1_uuid){
		for (const item of groupMemberList) {
			if (item.uuid == user_1_uuid) {
				return item.fullname;
			}
		}
		return '';
	}

	/*$("#file-id").change(function () {
		var fd = new FormData();
		var files = $('#file-id')[0].files[0];
		fd.append('file', files);

		$.ajax({
			url : 'upload.php',
			method : 'POST',
			data : fd,
			contentType: false,
			processData: false,
			success : function(response) {
				if (response != 0) {
					var fileName = document.querySelector('#file-id').value;
					fileName = fileName.substring(fileName.lastIndexOf('/')+1);
					fileName = fileName.substring(fileName.lastIndexOf('\\')+1);

					var extension = fileName.split('.').pop();

					var imageExtentions = ['png', 'gif', 'jpeg', 'jpg'];
					var file_type = '';
					if (imageExtentions.indexOf(extension) >= 0) {
						file_type = 'image';
					} else if (extension == 'mp4') {
						file_type = 'video';
					} else if (extension == 'mp3') {
						file_type = 'audio';
					}

					db.collection('chat')
						.add({
							message : response,
							user_1_uuid : user_uuid,
							user_2_uuid : chat_data.user_2_uuid,
							chat_uuid : chat_data.chat_uuid,
							view_status : 0,
							message_type : file_type,
							time : new Date(),
						})
						.then(function(docRef) {
							$('#file-id').val('');
						})
						.catch(function(error) {
							// console.error("Error adding document: ", error);
						});
				}
			}
		});
	});*/

	/*function fileExists(file_url){
		var http = new XMLHttpRequest();
		http.open('HEAD', file_url, false);
		http.send();
		return http.status != 404;
	}*/