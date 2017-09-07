 $(document).ready(function () {
	window.fbAsyncInit = function () {
		FB.init({
			appId: '258846137957143',
			xfbml: true,
			version: 'v2.6'
		});
	};

	(function (d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement(s);
		js.id = id;
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));
}); 

// user settings:
var user = {
	loggedIn: false,
	id: "",
	apps: {},
	saveHist: true,
	history: {}
}

// Initialize Firebase
var config = {
	apiKey: "AIzaSyCVEtucj21-LUbWrsaQkTmr4RLT_gmEGww",
	authDomain: "cartogram-users.firebaseapp.com",
	databaseURL: "https://cartogram-users.firebaseio.com",
	projectId: "cartogram-users",
	storageBucket: "cartogram-users.appspot.com",
	messagingSenderId: "87773780260"
};
firebase.initializeApp(config);
database = firebase.database();

function facebookSignin() {
	var provider = new firebase.auth.FacebookAuthProvider();
	firebase.auth().signInWithPopup(provider).then(function(result) {
		var token = result.credential.accessToken;
	}).catch(function(error) {

		console.log(error.code, error.message);
	});
}

function googleSignin() {
	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(provider).then(function (result) {}).catch(function (error) {
		console.log(error.code, error.message);
	});
}

function userSignout() {
	firebase.auth().signOut().then(function () {
		console.log("You have signed out.");
		location.reload();
	}, function (error) {});
}

var refThisUser;

function checkUser() {
	var refUsers = database.ref("/users");
	refUsers.once("value").then(function (snap) {
		// if this user does not exist, create user
		if (!snap.child(user.id).exists()) {
			var refNew = refUsers.child(user.id);
			refNew.set({
				history: {},
				saveHistory: true,
				apps: {
					weather: true,
					farmers: true
				}
			});
		}
		refThisUser = database.ref("/users/" + user.id);
		getUserData();
	});
}

function getUserData() {
	refThisUser.once("value").then(function (snap) {
		user.saveHist = snap.val().saveHistory;
		user.apps = snap.val().apps;
		user.history = snap.val().history;
		pickWidgets(user.apps);
	});
}

function addHistory(location) {
	if (user.loggedIn && user.saveHist) {
		database.ref("/users/" + user.id + "/history").push(location);
	}
}

// display only the selected widgets
function pickWidgets(appsList){
	if( appsList === undefined ){
		database.ref("/users/" + user.id + "/apps").once("value").then(function(snap) {
			var showApps = "#location-widget";
			showApps += snap.val().weather ? ", #weather-widget" : "";
			showApps += snap.val().farmers ? ", #farmers-widget" : "";
			$(".widget").hide();
			$(showApps).show();
		}, function(errorObject) {
		  console.log("The read failed: " + errorObject.code);
		});		
	}else{
		var showApps = "#location-widget";
		showApps += appsList.weather ? ", #weather-widget" : "";
		showApps += appsList.farmers ? ", #farmers-widget" : "";
		$(".widget").hide();
		$(showApps).show();		
	}
}

firebase.auth().onAuthStateChanged(function(logged) {

	if (logged) {
		// user is authenticated
		user.loggedIn = true;
		user.id = logged.uid;
		$(".avatar").attr("src", logged.photoURL);
		$("#google-login, #facebook-login, .login-button").hide();
		$(".logout-button, .avatar, .settings-button, .history-button").fadeIn(200).css("display", "block");
		checkUser();
	} else {
		// user is not authenticated ... they shouldn't be here
	}
});

var historyShown = false;
$(".history-button").on("click", function(){
	if( historyShown ){
		$("#widget-bar").fadeIn();
		$("#history-bar").fadeOut();
		historyShown = false;
	}else{
		database.ref("/users/" + user.id + "/history").once("value").then(function(snap){
			historyShown = true;
			var historyHtml = "<div class='card blue-ish darken-1'><div class='card-content white-text'><span class='card-title'>History</span>";
			snap.forEach(function(childr){
				historyHtml += "<p data-search='" + childr.val() + "'><i class='fa fa-search fa-1x'></i> " + childr.val() + "</p>";
			});
			historyHtml += "</div></div>";
			$("#widget-bar").fadeOut();
			$("#history-bar").html(historyHtml).fadeIn();
		});
	}
});

$(".login-button").on("click", function(){
	$("#login-options").fadeToggle(300);
});

$(".settings-button").on("click", function(){
	var checkedBoxes = "#nonexistent";
	database.ref("/users/" + user.id + "/saveHistory").once("value").then(function(snap){
		checkedBoxes += snap.val() ? ", #history-checkbox" : "";
	});
	database.ref("/users/" + user.id + "/apps").once("value").then(function(snap){
		$("#settings-save checkbox").attr("checked", "");
		checkedBoxes += snap.val().weather ? ", #weather-checkbox" : "";
		checkedBoxes += snap.val().farmers ? ", #farmers-checkbox" : "";
		$(checkedBoxes).attr("checked", "checked");
	});

	$("#settings-options").fadeToggle(300);
});

$("#settings-save").on("submit", function (event) {
	event.preventDefault();
	// get values of checkboxes -> send to database
	database.ref("/users/" + user.id + "/saveHistory").set($("#history-checkbox").is(':checked'));
	database.ref("/users/" + user.id + "/apps").set({
		weather: $("#weather-checkbox").is(':checked'),
		farmers: $("#farmers-checkbox").is(':checked')
	});
	pickWidgets();
	$("#settings-options").fadeOut(300);
});

$("#facebook-login").on("click", facebookSignin);
$("#google-login").on("click", googleSignin);
$(".logout-button").on("click", userSignout);