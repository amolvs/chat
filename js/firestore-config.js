// Initialize Firebase
var config = {
	// apiKey: "AIzaSyDQdJLluamjJSzzOqiVm-Bujgd20vPYISk",
	// authDomain: "my-test-app-91f99.firebaseapp.com",
	// databaseURL: "https://my-test-app-91f99.firebaseio.com",
	// projectId: "my-test-app-91f99",
	// storageBucket: "my-test-app-91f99.appspot.com",
	// messagingSenderId: "279160965485",
	apiKey: "AIzaSyDSiA560DDAL3kTG3Wob9cJHyLv_ibNpCc",
    authDomain: "ps-chat-c3965.firebaseapp.com",
    databaseURL: "https://ps-chat-c3965.firebaseio.com",
    projectId: "ps-chat-c3965",
    storageBucket: "ps-chat-c3965.appspot.com",
    messagingSenderId: "725636703849",
    // appId: "1:725636703849:web:14b0eccb82174136c3a4f8",
    // measurementId: "G-9F6ZCTZC2C"
};

firebase.initializeApp(config);

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

// Disable deprecated features
db.settings({
	timestampsInSnapshots: true
});