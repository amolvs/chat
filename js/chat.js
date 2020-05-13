var chat_data = {}, user_uuid, chatHTML = '', chat_uuid = "", userList = [], userRef = '';

	$(".attachment").hide();

	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			user_uuid = user.uid;
			getUsers();
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


	function getUsers() {
		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {getUsers:1},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					var users = resp.message.users;
					var usersHTML = '';
					$(".users").html(usersHTML);
					$.each(users, function(index, value) {
						if (user_uuid != value.uuid) {
							var login = value.log_in;
							var loginStatus = '';
							if (login == 'Online') {
								loginStatus = "<span class='login-status'><i class='fa fa-circle' aria-hidden='true'></i> Online</span>";
							} else {
								loginStatus = "<span class='login-status'><i class='fa fa-circle-o' aria-hidden='true'></i> Offline</span>";
							}

							db.collection('chat')
								.where('chat_uuid', '==', value.chat_uuid)
								.where('user_2_uuid', '==', user_uuid)
								.where('view_status', '==', 0)
								.get()
								.then(function(querySnapshot){
									var unreadCount = querySnapshot.size;
									if (unreadCount == 0 || value.uuid == userRef) {
										if (value.uuid == userRef)
											userRef = '';

										usersHTML = '<div class="user" uuid="'+value.uuid+'">'+
											'<div class="user-image"></div>'+
											'<div class="user-details">'+
												'<span>'+
													'<strong>'+value.fullname+'</strong>'+
												'</span>'+
												loginStatus+
											'</div>'+
										'</div>';
									} else {
										usersHTML = '<div class="user" uuid="'+value.uuid+'">'+
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
									$(".users").append(usersHTML);
								});

							userList.push({user_uuid: value.uuid, username: value.username});
						}
					});
				}else{
					// console.log(response.message);
				}
			}
		});
	}


	$(document.body).on('click', '.user', function() {
		userRef = $(this).attr('uuid');
		getUsers();

		var name = $(this).find("strong").text();
		var user_1 = user_uuid;
		var user_2 = $(this).attr('uuid');
		$('.message-container').html('Connecting...!');

		$(".name").text(name);
		$(".attachment").show();

		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {connectUser:1, user_1:user_1, user_2: user_2},
			success : function(resposne) {
				var resp = JSON.parse(resposne);
				chat_data = {
					chat_uuid : resp.message.chat_uuid,
					user_1_uuid : resp.message.user_1_uuid,
					user_2_uuid : resp.message.user_2_uuid,
					user_1_name : '',
					user_2_name : name
				};
				$('.message-container').html('Say Hi to '+name);
				$(".logIn").text('(' + resp.message.log_in + ')');

				chat_uuid = chat_data.chat_uuid;
				realTime();
			}
		});

	});


	$(".send-btn").on('click', function() {
		var message = $(".message-input").val();
		if (message != "") {
			db.collection('chat')
				.add({
					message : message,
					user_1_uuid : user_uuid,
					user_2_uuid : chat_data.user_2_uuid,
					chat_uuid : chat_data.chat_uuid,
					view_status : 0,
					message_type : 'text',
					time : new Date(),
				})
				.then(function(docRef) {
					$(".message-input").val("");
				})
				.catch(function(error) {
					// console.error("Error adding document: ", error);
				});
		}
	});


	var newMessage = '';
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
	}


	$(".search-user").keyup(function() {
		var searchTxt = $(".search-user").val();
		$(".search-users-list").hide();
		if (searchTxt == '')
			return;
		$(".search-users-list").show();
		$(".attachment").show();

		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {searchUser: 1, keyword: searchTxt},
			success : function(response) {
				var resp = JSON.parse(response);
				if(resp.status == 200){
					var users = resp.message.users;
					var usersListHTML = '';
					usersListHTML += '<option value="">Select User</option>';
					$.each(users, function(index, value) {
						if (user_uuid != value.uuid) {
							usersListHTML += '<option value="'+value.uuid+'">'+
											value.fullname+
										'</option>';

							userList.push({user_uuid: value.uuid, username: value.username});
						}
					});

					$(".userList").html(usersListHTML);

				} else {
					// console.log(response.message);
				}
			}
		});
	});


	$("select.userList").change(function() {
		var user_uuid_2 = $(this).children("option:selected").val();
		if (user_uuid_2 == '')
			return;

		$(".search-users-list").hide();
		$(".search-user").val('');
		var name = $(this).children("option:selected").text();
		var user_1 = user_uuid;
		var user_2 = user_uuid_2;
		$('.message-container').html('Connecting...!');
		$(".name").text(name);
		$(".logIn").text('');

		$.ajax({
			url : 'process.php',
			method : 'POST',
			data : {connectUser:1, user_1:user_1, user_2: user_2},
			success : function(resposne) {
				var resp = JSON.parse(resposne);
				chat_data = {
					chat_uuid : resp.message.chat_uuid,
					user_1_uuid : resp.message.user_1_uuid,
					user_2_uuid : resp.message.user_2_uuid,
					user_1_name : '',
					user_2_name : name
				};
				$('.message-container').html('Say Hi to '+name);

				getUsers();

				chat_uuid = chat_data.chat_uuid;
				realTime();
			}
		});
	});

	$("#file-id").change(function () {
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
	});

	function fileExists(file_url){
		var http = new XMLHttpRequest();
		http.open('HEAD', file_url, false);
		http.send();
		return http.status != 404;
	}