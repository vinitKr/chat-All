var app = angular.module('videoApp', []);

app.controller('chatCtrl', function($scope, $window){
   var socket = io.connect();

   var connectedUser, thisUser, yourConn, stream;

   var vendorUrl = $window.URL || $window.webKitURL;

   var localVideo = angular.element(document.querySelector('#localVideo')); 
   var remoteVideo = angular.element(document.querySelector('#remoteVideo')); 

   $scope.groupMsg = [];
   $scope.personalMsg = [];
   $scope.users = [];
   $scope.chatbox = [];

   $scope.login = function (username) { 
      thisUser = username;
      if (username.length > 0) { 
         send({ 
            type: "login", 
            name: username 
         }); 
      }

   };

   //initiating a call 
   $scope.videoCall = function (callToUsername) { 
      $scope.goto = 'videos';
      if (callToUsername.length > 0) { 

         connectedUser = callToUsername;
         getUserMedia({ video: true, audio: true }, function (myStream) { 
            stream = myStream; 

            localVideo[0].src = vendorUrl.createObjectURL(stream);

            yourConn.addStream(stream); 

            // create an offer 
            yourConn.createOffer(function (offer) { 
               send({ 
                  type: "offer", 
                  offer: offer 
               }); 

               yourConn.setLocalDescription(offer); 
            }, function (error) { 
               alert("Error when creating an offer"); 
            });

         }, function (error) { 
            console.log(error); 
         }); 
      } 
   };

   //hang up 
   $scope.hangUp = function () { 

      send({ 
         type: "leave" 
      });  

      handleLeave(); 
   };

   //send message
   $scope.sendToGroup = function(message) {
      socket.emit('groupText', {name:thisUser, msg:message});
      $scope.groupMsgbox = '';
   }

   $scope.sendPersonal = function(message) {
      $scope.personalMsg.push({name:thisUser, msg:message});
      send({
         type: "personalText",
         msg: message
      });
      $scope.persoalMsgbox = '';
   }

   $scope.chat = function(sendToUsername){
      connectedUser = sendToUsername;
      if($scope.chatbox.indexOf(connectedUser) == -1)
      $scope.chatbox.push(connectedUser);
   }

   $scope.closeChatbox = function(box){
      $scope.chatbox.splice($scope.chatbox.indexOf(box), 1)
      delete $scope.chatbox[box];
   }

   socket.on('groupText', function(data){
      $scope.$apply($scope.groupMsg.push({name:data.name, msg:data.msg}));
      
   });

   socket.on('users', function(data){
      $scope.$apply(function($scope){
         $scope.users = data;
      })
   });

   //when we got a message from a signaling server 
   socket.on('message', function (msg) { 
      console.log("Got message", msg);

      var data = msg; 

      switch(data.type) { 
         case "login": 
         handleLogin(data.success); 
         break; 
         case "personalText": 
         handlePersonalText(data.msg, data.name); 
         break; 
         //when somebody wants to call us 
         case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
         case "answer": 
         handleAnswer(data.answer); 
         break; 
         //when a remote peer sends an ice candidate to us 
         case "candidate": 
         handleCandidate(data.candidate); 
         break; 
         case "leave": 
         handleLeave(); 
         break; 
         default: 
         console.log("data type dosn't match")
         break; 
      }
   });

   function handleLogin(success) { 
      if (success === false) { 
         $scope.show = true;
         $scope.$digest();
         alert("Ooops...try a different username");
         return;
      } else {

         var configuration = {
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
         };

         yourConn = new RTCPeerConnection(configuration)

         yourConn.onaddstream = function (e) { 
            remoteVideo[0].src = vendorUrl.createObjectURL(e.stream); 
         };

         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  

      } 
   };

   function handlePersonalText(msg, name){
      connectedUser = name;
      if($scope.chatbox.indexOf(name) == -1){
         $scope.$apply(function($scope){
            $scope.chatbox.push(name); 
            $scope.personalMsg.push({name:name, msg:msg})
         });
      } else {
         $scope.$apply($scope.personalMsg.push({name:name, msg:msg}));
      }
   }

   //when somebody sends us an offer 
   function handleOffer(offer, name) { 
      var val = confirm('call from '+name+'. Do you want to accept it?')
      if(val){
         connectedUser = name;
         $scope.goto = 'videos';
         $scope.$digest();
         getUserMedia({ video: true, audio: true }, function (myStream) { 
            stream = myStream; 

            localVideo[0].src = vendorUrl.createObjectURL(stream);

            yourConn.addStream(stream); 
            
            yourConn.setRemoteDescription(new RTCSessionDescription(offer));

            //create an answer to an offer 
            yourConn.createAnswer(function (answer) { 
               yourConn.setLocalDescription(answer); 

               send({ 
                  type: "answer", 
                  answer: answer 
               }); 

            }, function (error) { 
               alert("Error when creating an answer"); 
            });

         }, function (error) { 
            console.log(error); 
         }); 

      }
      
   };

   //when we got an answer from a remote user
   function handleAnswer(answer) { 
      yourConn.setRemoteDescription(new RTCSessionDescription(answer));
   };

   //when we got an ice candidate from a remote user 
   function handleCandidate(candidate) { 
      yourConn.addIceCandidate(new RTCIceCandidate(candidate));
   };

   function handleLeave() { 
      connectedUser = null; 
      remoteVideo[0].src = null; 

      yourConn.close(); 
      yourConn.onicecandidate = null; 
      yourConn.onaddstream = null;
   };

   function send(message) { 
      if (connectedUser) { 
         message.name = connectedUser; 
      }
      socket.emit('message', message)
   };

   socket.on('error', function (err) { 
      console.log("Got error", err); 
   });
});