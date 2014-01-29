var test;
var test_id;
var intervalMap = new Object();
var clocksMap = new Object();
var timeSyncMap = new Object();
var userClock;
var time;
easyCounter = 1;
mediumCounter = 1;
difficultCounter = 1;

Meteor.startup(function () {
	stream = new Meteor.Stream('ctrl');
	questionStream = new Meteor.Stream('qstns');

	ActiveUsers = new Meteor.Collection("ActiveUsers");
	Tests = new Meteor.Collection("Tests");
	Questions = new Meteor.Collection("Questions");
	UserClocks = new Meteor.Collection("UserClocks");

	Meteor.publish("UserQuestions", function(){
		return UserQuestions.find({"_id": this.userId});
	});
	
	stream.permissions.write(function(eventName) {
	  return true;
	});
	stream.permissions.read(function(eventName) {
	  return true;
	});

	questionStream.permissions.write(function(eventName) {
	  return true;
	});
	questionStream.permissions.read(function(eventName) {
	  return true;
	});

	stream.on('timerSync', function() {
	    var self = this;
	    console.log("Time sync requested.");
	});

	GetUserName = function(userId){
		var user = Meteor.users.findOne(userId);
		//if(!!user)
			return user.username;
	}	

	fetchQuestion = function(level){
		var question;
		if(level === 1){
			if(easyCounter > 1){
				easyCounter = easyCounter - 1;
				question = Questions.findOne({_id: "e" + easyCounter});
			}
		}else if(level == 2){

		}else if(level === 3){
			if(difficultCounter > 1){
				difficultCounter = difficultCounter - 1;
				question = Questions.findOne({_id: "d" + difficultCounter});
			}
		}
		//Also need to remove the question from the list
		return question;
	}

	test = new Test();
	test_id = test.init();
	test.start();
});

Meteor.methods({
	loginUser: function(){		
		var userId = this.userId;
		var username = GetUserName(this.userId);
		console.log("User logged in : " + username);
		if(!test.isUserAllowed(username)){
			Meteor.users.update(userId, {$set: { "services.resume.loginTokens" : [] }});
			console.log(username + " is not allowed.");
			return;
		}
		var active = ActiveUsers.findOne(this.userId);
		if(!!active){
			console.log("Relogin");
			userClock = UserClocks.findOne(userId);
			stream.emit(this.userId, userClock.timeLeft);
			if(active.testEnded){
				Meteor.users.update(userId, {$set: { "services.resume.loginTokens" : [] }});
				//throw new Error(403, "You can not login again");
			}
		}else{
			console.log("First login");
			ActiveUsers.insert({
				_id: this.userId,
				username: username,
				score: 0,
				level: 1,
				testEnded: false
			});
			var question = fetchQuestion(1);
			if(!!question){
				UserQuestions.insert({
					_id: this.userId,
					question: question.questionText,
					options: question.choices
				});
			}else{
				console.log("Could not obtain question for user: " + username);
			}
			var clockId = UserClocks.insert({
				_id: userId,
				timeLeft:600 
			});
			console.log("Clock id: " + clockId) ;
			clocksMap[this.userId] = clockId;
			FullQuestion = [question.questionText, question.choices[0], question.choices[1], question.choices[2], question.choices[3]];
			//Send question over stream
			questionStream.emit(this.userId, FullQuestion);
			console.log("just sent question to user.");
			//Time sync
			userClock = UserClocks.findOne(userId);
			stream.emit(this.userId, userClock.timeLeft);
			console.log("Sent initial sync message");

			var interval = Meteor.setInterval(function(){
				userClock = UserClocks.findOne(userId);
				time = userClock.timeLeft;
				time = time - 1;
				UserClocks.update(userClock._id, {timeLeft: time});
				console.log("Timer running, time Left: " + userClock.timeLeft);
				if(time % 3 == 0){
					stream.emit(this.userId, time);
					console.log("Sending sync message to: " + userId);
				}
				if(time === 0){
					//logout user
					ActiveUsers.update(userId, {testEnded: true});
					Meteor.users.update(userId, {$set: { "services.resume.loginTokens" : [] }});
					Meteor.clearInterval(intervalMap[userId]);
				}
			}, 1000);
			intervalMap[this.userId] = interval;
		}
	},
	logoutUser: function(userId){
		check(userId, String);
		console.log("Used logged out: " + userId);
	},
	endTest: function(userId){
		check(userId, String);
		if(userId === this.userId){

		}
	}
});