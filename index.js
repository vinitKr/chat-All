var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var routes = require('./routes');

var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'client', 'views'));

app.use(express.static(path.resolve(__dirname, 'client')));
app.use(bodyParser.json());
app.use('/', routes);

var users = {};

io.on('connection', function(socket) {
	console.log("User connected");
   socket.on('message', function(message) { 

   	var data = message;

      //switching type of the user message 
      switch (data.type) { 
         //when a user tries to login
         case "login": 
         console.log("User logged", data.name); 

            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
            	sendTo(socket, { 
            		type: "login", 
            		success: false 
            	}); 
            } else { 
               //save user socket on the server 
               users[data.name] = socket; 
               socket.name = data.name;
               updateUsers();
               sendTo(socket, { 
               	type: "login",
               	success: true 
               }); 
           } 

           break;

           case "personalText": 
            //for ex. UserA wants to call UserB 
            console.log("Sending personalText to: ", data.name);

            //if UserB exists then send him offer details 
            var conn = users[data.name]; 

            if(conn != null) { 
               //setting that UserA connected with UserB 
               socket.otherName = data.name; 
               sendTo(conn, { 
               	type: "personalText", 
               	msg: data.msg, 
               	name: socket.name 
               }); 
           }

           break;

           case "offer": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: ", data.name);

            //if UserB exists then send him offer details 
            var conn = users[data.name]; 

            if(conn != null) { 
               //setting that UserA connected with UserB 
               socket.otherName = data.name; 
               sendTo(conn, { 
                type: "offer", 
                offer: data.offer, 
                name: socket.name 
               }); 
           }

           break;

           case "answer": 
           console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 

            if(conn != null) { 
            	socket.otherName = data.name; 
            	sendTo(conn, { 
            		type: "answer", 
            		answer: data.answer 
            	}); 
            } 

            break; 

            case "candidate": 
            console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];

            if(conn != null) { 
            	sendTo(conn, { 
            		type: "candidate", 
            		candidate: data.candidate 
            	}); 
            } 

            break;
            
            case "leave": 
            console.log("Disconnecting from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 

            //notify the other user so he can disconnect his peer socket 
            if(conn != null) {
            	sendTo(conn, { 
            		type: "leave" 
            	}); 
            }

            break;

            default: 
            sendTo(socket, { 
            	type: "error", 
            	message: "Command not found: " + data.type 
            }); 

            break; 
        }

    }); 

   socket.on('groupText', function(data){
    io.emit('groupText', data);
   })

   //when user exits, for example closes a browser window 
   //this may help if we are still in "offer","answer" or "candidate" state 
   socket.on("disconnect", function() { 

   	if(socket.name) { 
      delete users[socket.name]; 
      updateUsers();

      if(socket.otherName) { 
        console.log("Disconnecting from ", socket.otherName); 
        var conn = users[socket.otherName];
        // conn.otherName = null;

        if(conn != null) { 
          sendTo(conn, { 
            type: "leave",
          }); 
        }
      } 
    } 

   });  

});

function updateUsers(){
  io.emit('users', Object.keys(users));
}

function sendTo(socket, message) { 
	socket.emit('message', message);
}


http.listen(port, function() {
    console.log('SERVER RUNNING.. PORT: ' + port);
})