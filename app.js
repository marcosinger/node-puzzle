// Setup basic express server
var express = require('express');
var app     = express('10.0.1.5');
var server  = require('http').createServer(app);
var io      = require('socket.io', { rememberTransport: false, transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling'] })(server);
var port    = process.env.PORT || 3001;

// puzzle core
var puzzleArray = [
                  {path: 'A', color: '#7f8c8d', rightPosition: 0, taken: false, positioned: true},
                  {path: 'B', color: '#c0392b', rightPosition: 1, taken: false, positioned: true},
                  {path: 'C', color: '#3498db', rightPosition: 2, taken: false, positioned: true},
                  {path: 'D', color: '#9b59b6', rightPosition: 3, taken: false, positioned: true},
                  // {path: 'E', color: '#34495e', rightPosition: 4, taken: false, positioned: true},
                  // {path: 'F', color: '#f39c12', rightPosition: 5, taken: false, positioned: true},
                  // {path: 'G', color: '#d35400', rightPosition: 6, taken: false, positioned: true},
                  // {path: 'H', color: '#2ecc71', rightPosition: 7, taken: false, positioned: true},
                  // {path: 'I', color: '#1abc9c', rightPosition: 8, taken: false, positioned: true}
                ]


var puzzleManager = function(puzzleArray){
  var _this         = this;
  this.puzzleArray  = puzzleArray;
  this.clientsArray = {};

  this.startup = function(){
    this.shufflePuzzle();
  },

  this.shufflePuzzle = function() {
    for (var i = this.puzzleArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this.puzzleArray[i];
        this.puzzleArray[i] = this.puzzleArray[j];
        this.puzzleArray[j] = temp;

        if(this.puzzleArray[i].rightPosition !== i){ this.puzzleArray[i].positioned = false; }
        if(this.puzzleArray[j].rightPosition !== j){ this.puzzleArray[j].positioned = false; }
    }
    return this.puzzleArray;
  }

  this.getPuzzleCard = function(socketId){
    for (var i = 0; i < this.puzzleArray.length; i++) {
      if(this.puzzleArray[i].taken){ continue; }

      this.puzzleArray[i].taken   = true;
      this.clientsArray[socketId] = this.puzzleArray[i];
      this.clientsArray[socketId].index = i;

      return this.puzzleArray[i];
    };
  },

  this.changePuzzleCards = function(socketIdHolding, socketIdClicked){
    var holdindCard = this.clientsArray[socketIdHolding];
    var clickedCard = this.clientsArray[socketIdClicked];

    var holdindCardIndex = this.clientsArray[socketIdHolding].index;
    var clickedCardIndex = this.clientsArray[socketIdClicked].index;
 
    this.clientsArray[socketIdHolding] = clickedCard;
    this.clientsArray[socketIdClicked] = holdindCard;

    this.clientsArray[socketIdHolding].index = holdindCardIndex;
    this.clientsArray[socketIdClicked].index = clickedCardIndex;

    this.verifyPuzzleCardPositionFor(this.clientsArray[socketIdHolding]);
    this.verifyPuzzleCardPositionFor(this.clientsArray[socketIdClicked]);
  },

  this.verifyPuzzleCardPositionFor = function(puzzleCard){
    if(puzzleCard.index === puzzleCard.rightPosition){
      puzzleCard.positioned = true;
    }else{
      puzzleCard.positioned = false;
    }
  },

  this.isPuzzleCompleted = function(){
    for (var i = 0; i < this.puzzleArray.length; i++) {
      if(this.puzzleArray[i].positioned === false){ 
        return false; 
      }
    }
    return true;
  }

  this.startup();
}

var pM      = new puzzleManager(puzzleArray);

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

  // users[socket.id] = {id: socket.id, position: numUsers,color: colors[Math.floor((Math.random() * 9))]};

  socket.emit('welcome', pM.getPuzzleCard(socket.id));


  console.log(users);
  console.log("\n");

  socket.on('click', function (data) {
    if (activeUser) {
      console.log('[CLICK AND CHANGE]');

      pM.changePuzzleCards(activeUser, socket.id);
      io.to(socket.id).emit('change', pM.clientsArray[socket.id]);
      socket.broadcast.to(activeUser).emit('change', pM.clientsArray[activeUser]);

      console.log('[COMPLETED?]');
      console.log(pM.isPuzzleCompleted());
      // var holdingTile = {position: users[activeUser].position, color: users[activeUser].color};
      // var clickedTile = {position: users[data.id].position, color: users[data.id].color};

      // users[activeUser].position = clickedTile.position;
      // users[activeUser].color    = clickedTile.color;
      // users[data.id].position    = holdingTile.position;
      // users[data.id].color       = holdingTile.color;
      
      // io.to(socket.id).emit('change', users[data.id]);
      // socket.broadcast.to(activeUser).emit('change', users[activeUser]);

      // console.log(users);
      // console.log("\n");

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