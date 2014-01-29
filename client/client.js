var currentTime;
if (Meteor.isClient) {
  
  stream = new Meteor.Stream('ctrl');
  questionStream = new Meteor.Stream('qstns');

  Meteor.subscribe("UserQuestions");

  UserClock = new Meteor.Collection(null);

  var userId;

  Handlebars.registerHelper("navClassFor", function (nav, options) {
      return Meteor.router.navEquals(nav) ? "active" : "";
  });

  function setLayout (context) {
      this.layout('loggedInLayout');    
  }

  Template.loggedInLayout.Timer = function(){
    if(Meteor.userId()){
      var usercl = UserClock.findOne(Meteor.userId());
      return "Time: " + usercl.timeLeft;
    }
  }

  Template.postIndex.rendered = function(){
    $("pre.styles").snippet("css", {style:"emacs",transparent:true});
  }

  Template.postIndex.question = function(){
    if(Meteor.userId()){
      var userq = UserQuestions.findOne(Meteor.userId());
      //return userq.question;
    }
  }
  Template.postIndex.optiona = function(){
    if(Meteor.userId()){
      var userq = UserQuestions.findOne(Meteor.userId());
      //return userq.options[0];
    }
  }
  Template.postIndex.optionb = function(){
    if(Meteor.userId()){
      var userq = UserQuestions.findOne(Meteor.userId());
     // return userq.options[1];
    }
  }
  Template.postIndex.optionc = function(){
    if(Meteor.userId()){
      var userq = UserQuestions.findOne(Meteor.userId());
      //return userq.options[2];
    }
  }
  Template.postIndex.optiond = function(){
    if(Meteor.userId()){
      var userq = UserQuestions.findOne(Meteor.userId());
     // return userq.options[3];
    }
    else return "Not logged in";
  }

  stream.on(Meteor.userId(), function(newTime) {
      console.log("received new time: " + newTime);
      var diff = currentTime - newTime;
      if(diff < -1 || diff > 1){
        console.log("Notable time difference. Diff is : " + diff);
      }
      if(Meteor.userId()){
        UserClock.update(Meteor.userId(), {timeLeft: newTime});
      }
    });

  questionStream.on(Meteor.userId(), function(FullQuestion){
    console.log("New question received");
    if(!!FullQuestion){
      if(Meteor.userId()){
        //UserQuestions.upsert({_id: Meteor.userId()}, {$set: {question: FullQuestion[0], optiona: FullQuestion[1], optionb: FullQuestion[2], optionc: FullQuestion[3], optiond: FullQuestion[4]}});
      }
    }
  });
 
  Meteor.pages({
    '/': { to: 'postIndex', as: 'root', before: setLayout, nav: 'home' },
    '/401': { to: 'unauthorized', before: setLayout },
    '*': { to: 'notFound', before: setLayout }
  });

  var timerInterval;

  Deps.autorun(function(){
    Deps.autorun(function(){
      if(Meteor.userId()){

        if(!userId || (userId && userId != Meteor.userId())){
          console.log("User logged in: " + Meteor.userId());
          Meteor.call("loginUser");
          userId = Meteor.userId();
          currentTime = 60;
          console.log("Calling insert");
          var clockId = UserClock.upsert({_id: Meteor.userId()},{$set: {timeLeft: 60}});
          stream.emit('timerSync', Meteor.userId());          
          timerInterval = Meteor.setInterval(function(){
            if(Meteor.userId()){
              var currentTimeO = UserClock.findOne(Meteor.userId());
              currentTime = currentTimeO.timeLeft;
              currentTime = currentTime - 1;
              UserClock.update(Meteor.userId(), {timeLeft: currentTime});
              if(currentTime <= 0){
                Meteor.clearInterval(timerInterval);
              }
            }
          }, 1000);
        }
      }
      if(!Meteor.userId()){
        if(userId){
          Meteor.call("logoutUser", userId);
          console.log("User logged out");
          userId = null;
          Meteor.clearInterval(timerInterval);
        }
      }
    });
  });
}