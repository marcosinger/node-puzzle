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

  users[socket.id] = {id: socket.id, position: numUsers,color: colors[Math.floor((Math.random() * 9))]};

  socket.emit('welcome', users[socket.id]);


  console.log(users);
  console.log("\n");

  socket.on('click', function (data) {
    if (activeUser) {
      console.log('[CLICK AND CHANGE]');

      console.log('showing data')
      console.log(data)

      var holdingTile = {position: users[activeUser].position, color: users[activeUser].color};
      var clickedTile = {position: users[data.id].position, color: users[data.id].color};

      users[activeUser].position = clickedTile.position;
      users[activeUser].color    = clickedTile.color;
      users[data.id].position    = holdingTile.position;
      users[data.id].color       = holdingTile.color;
      
      io.to(socket.id).emit('change', users[data.id]);
      socket.broadcast.to(activeUser).emit('change', users[activeUser]);

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
