Test = function(){};
Test.prototype = {
	init: function(){
			this.test_id = Tests.insert({
				initTime: Math.round(new Date().getTime() / 1000)
			});
			//Load questions
			if(Questions.find().count() <= 0)	{
				for(var i = 0; i < 5; i++){
					Questions.insert({
						_id: "d" + difficultCounter,
						questionText: "Question(d): " + difficultCounter,
						choices: ["Option A", "Option A", "Option A", "Option D"]
					});
					difficultCounter++;
				}
				for(var i = 0; i<5; i++){
					Questions.insert({
						_id: "e" + easyCounter,
						questionText: "Question(e): " + easyCounter,
						choices: ["Option A", "Option A", "Option A", "Option D"]
					});
					easyCounter++;
				}
			}else{
				easyCounter = 5;
			}
			console.log("Loded questions: " + easyCounter);
				//Load allowed users
			this.allowed_users = ["user1", "user2"];
			this.total_users = 2;
			this.admins = ["pawan", "bageera"];
		return this.test_id;
	},
	restart: function(){
	},
	start: function(){
		this.test_started = true;
	},
	getTestId: function(){
		return this.test_id;
	},
	IsTestRunning: function(){
		return this.test_started;
	},
	endTest: function(){
		//Unload Questions
		//Unload timer
		//unload UserQuestions etc.
		//Logout all users.
		//Meteor.users.update({}, {$set: { "services.resume.loginTokens" : [] }});
		this.test_started = false;
	},
	isUserAllowed: function(username){
		for(var i = 0; i < this.total_users; i++){
			if(this.allowed_users[i] === username){
				return true;
				break;
			}
		}
		console.log("Usr: " + username + " not found");
		return false;
	}
}