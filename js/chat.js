var chat_data = {}, user_uuid, chatHTML = '', chat_uuid = "", userList = [], userRef = '';;
		firebase.auth().onAuthStateChanged(function(user) {
		  if (user) {
		    // console.log(user);
		    user_uuid = user.uid;

			getUsers();
		    // console.log(user_uuid);

		  } else {
		    // console.log("Not sign in");
		  }
		});


		function logout(){
			
			$.ajax({
				url : 'process.php',
				method : 'POST',
				data : {logoutUser:1},
				success : function(response){
					// console.log(response);
					firebase.auth().signOut().then(function() {
					  // console.log('Logout');

					  window.location.href = "index.php";

					}).catch(function(error) {
					  // An error happened.
					  // console.log('Logout Fail');
					});
				}
			});
			
		
		}

		function getUsers(){
			$.ajax({
				url : 'process.php',
				method : 'POST',
				data : {getUsers:1},
				success : function(response){
					// console.log(response);
					var resp = JSON.parse(response);
					if(resp.status == 200){
						var users = resp.message.users;
						var usersHTML = '';
						$(".users").html(usersHTML);
						$.each(users, function(index, value){
							// console.log(value.uuid)
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

						// $(".users").html(usersHTML);

					}else{
						// console.log(response.message);
					}
				}
			});
		}


		

		

		$(document.body).on('click', '.user', function(){
			// console.log($(this).attr('uuid'));
			userRef = $(this).attr('uuid');
			getUsers();
			
			var name = $(this).find("strong").text();
			// var loginStatus = $(this).find(".login-status").text().trim();
			var user_1 = user_uuid;
			var user_2 = $(this).attr('uuid');
			$('.message-container').html('Connecting...!');

			$(".name").text(name);

			$.ajax({
				url : 'process.php',
				method : 'POST',
				data : {connectUser:1, user_1:user_1, user_2: user_2},
				success : function(resposne){
					// console.log(resposne);
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


					db.collection('chat')
						.where('chat_uuid', '==', chat_data.chat_uuid)
						.orderBy('time')
						.limit(10)
						.get()
						.then(function(querySnapshot){
							chatHTML = '';
							querySnapshot.forEach(function(doc){
								var myDate = new Date(1000 * doc.data().time.seconds);
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

								if (doc.data().user_1_uuid == user_uuid) {
									chatHTML += '<div class="message-block received-message">'+
													'<div class="user-icon"></div>'+
													'<div class="message">'+ doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
												'</div>';
								} else {
									chatHTML += '<div class="message-block">'+
													'<div class="user-icon"></div>'+
													'<div class="message">'+ doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
												'</div>';
								}

								if (doc.data().user_2_uuid == user_uuid) {
									db.collection("chat").doc(doc.id).update({view_status: 1});
								}
							});

							$(".message-container").html(chatHTML);
						});

					if (chat_uuid == "") {
						chat_uuid = chat_data.chat_uuid;
						realTime();
					}
				}
			});

		});


		$(".send-btn").on('click', function(){
			var message = $(".message-input").val();
			if(message != ""){
				db.collection('chat')
				.add({
				    message : message,
				    user_1_uuid : user_uuid,
				    user_2_uuid : chat_data.user_2_uuid,
				    chat_uuid : chat_data.chat_uuid,
				   	// user_1_isView : 1,
				   	// user_2_isView : 0,
				   	view_status : 0,
				    time : new Date(),
				})
				.then(function(docRef) {
					$(".message-input").val("");
				    // console.log("Document written with ID: ", docRef.id);
				})
				.catch(function(error) {
				    // console.error("Error adding document: ", error);
				});
			}


		});

		var newMessage = '';
		function realTime(){
			db.collection('chat')
				.where('chat_uuid', '==', chat_data.chat_uuid)
				.orderBy('time')
				.onSnapshot(function(snapshot) {
					newMessage = '';
					snapshot.docChanges().forEach(function(change) {
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

							if (change.doc.data().user_1_uuid == user_uuid) {
								newMessage += '<div class="message-block received-message">'+
													'<div class="user-icon"></div>'+
													'<div class="message">'+ change.doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
												'</div>';
							} else {
								newMessage += '<div class="message-block">'+
													'<div class="user-icon"></div>'+
													'<div class="message">'+ change.doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
												'</div>';
							}
							if (change.doc.data().user_2_uuid == user_uuid) {
								db.collection("chat").doc(change.doc.id).update({view_status: 1});
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

		$(".search-user").keyup(function(){
			var searchTxt = $(".search-user").val();
			// console.log('searchTxt:' + searchTxt);
			$(".search-users-list").hide();
			if (searchTxt == '')
				return;
			$(".search-users-list").show();

			$.ajax({
				url : 'process.php',
				method : 'POST',
				data : {searchUser: 1, keyword: searchTxt},
				success : function(response){
					// console.log(response);
					var resp = JSON.parse(response);
					if(resp.status == 200){
						var users = resp.message.users;
						var usersListHTML = '';
						usersListHTML += '<option value="">Select User</option>';
						$.each(users, function(index, value){
							// console.log(value.uuid)
							if (user_uuid != value.uuid) {
								usersListHTML += '<option value="'+value.uuid+'">'+
												value.fullname+
											'</option>';

								userList.push({user_uuid: value.uuid, username: value.username});
							}
						});

						$(".userList").html(usersListHTML);

					}else{
						// console.log(response.message);
					}
				}
			});
		});

		$("select.userList").change(function(){
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
				success : function(resposne){
					// console.log(resposne);
					var resp = JSON.parse(resposne);
					chat_data = {
						chat_uuid : resp.message.chat_uuid,
						user_1_uuid : resp.message.user_1_uuid,
						user_2_uuid : resp.message.user_2_uuid,
						user_1_name : '',
						user_2_name : name
					};
					$('.message-container').html('Say Hi to '+name);

					db.collection('chat').where('chat_uuid', '==', chat_data.chat_uuid)
					.orderBy('time')
					.get()
					.then(function(querySnapshot){
						chatHTML = '';
						querySnapshot.forEach(function(doc){
							var myDate = new Date(1000 * doc.data().time.seconds);
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

							if (doc.data().user_1_uuid == user_uuid) {
								chatHTML += '<div class="message-block received-message">'+
												'<div class="user-icon"></div>'+
												'<div class="message">'+ doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
											'</div>';
							} else {
								chatHTML += '<div class="message-block">'+
												'<div class="user-icon"></div>'+
												'<div class="message">'+ doc.data().message +'<div class="message-time">'+ strTime +'</div></div>'+
											'</div>';
							}

							if (doc.data().user_2_uuid == user_uuid) {
								db.collection("chat").doc(doc.id).update({view_status: 1});
							}
						});

						$(".message-container").html(chatHTML);
					});
					getUsers();

					if (chat_uuid == "") {
						chat_uuid = chat_data.chat_uuid;
						realTime();
					}

				}
			});
		});