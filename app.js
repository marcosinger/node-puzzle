// Setup basic express server
var express = require('express');
var app = express('10.0.1.2');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

var activeUser;
var numUsers = 0;
var users = [];
var colors = [
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#34495e',
  '#f39c12',
  '#d35400',
  '#c0392b',
  '#7f8c8d'
];

io.on('connection', function (socket) {
  ++numUsers;
  console.log('[NEW USER] - We have %d users connected', numUsers);

  var user = {
    id: socket.id,
    position: numUsers,
    color: colors[Math.floor((Math.random() * 9))]
  };

  users.push(user);
  socket.emit('welcome', user);


  console.log(users);
  console.log("\n");

  socket.on('click', function (data) {
    if (activeUser) {
      console.log('[CLICK AND CHANGE]');
      socket.broadcast.to(activeUser).emit('change', data)

      for (i=0; i < users.length; i++) {
        if (users[i].id == activeUser) {
          io.to(socket.id).emit('change', users[i]);

          var old = {
            id: users[i].id,
            position: data.position,
            color: data.color
          }

          users[i] = {
            id: data.id, 
            position: users[i].position,
            color: users[i].color
          }

          users[data.position - 1] = old;
          break;
        }
      }

      console.log(users);
      console.log("\n");

      activeUser = null;
    }else {
      console.log('[CLICK AND HOLD]');
      activeUser = socket.id
    }
  });

  socket.on('disconnect', function () {
    --numUsers;
    console.log('[USER LEFT] - We have %d users connected', numUsers);
  });
});
