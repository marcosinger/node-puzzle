// underscore lib
var _ = require('underscore');

// Setup basic express server
var express = require('express.io');
var app     = express('localhost');
var port    = process.env.PORT || 3001;

// init express.io
app.http().io();

// Routing
app.use(express.static(__dirname + '/public'));

// listing port 
app.listen(port);

// puzzle core
var puzzleManager = function() {
  var _this         = this;
  var puzzle        = [
                      {path: 'A', color: '#7f8c8d', rightPosition: 0, taken: false, positioned: true},
                      {path: 'B', color: '#c0392b', rightPosition: 1, taken: false, positioned: true},
                      {path: 'C', color: '#3498db', rightPosition: 2, taken: false, positioned: true},
                      {path: 'D', color: '#9b59b6', rightPosition: 3, taken: false, positioned: true},
                      {path: 'E', color: '#34495e', rightPosition: 4, taken: false, positioned: true},
                      {path: 'F', color: '#f39c12', rightPosition: 5, taken: false, positioned: true}
                      //{path: 'G', color: '#d35400', rightPosition: 6, taken: false, positioned: true},
                      //{path: 'H', color: '#2ecc71', rightPosition: 7, taken: false, positioned: true},
                      //{path: 'I', color: '#1abc9c', rightPosition: 8, taken: false, positioned: true}
                  ]
  this.puzzleArray  = _.shuffle(puzzle);
  this.clientsArray = {};

  this.getPuzzleCard = function(socketId, screenNumber){
    var puzzleCard = _.findWhere(this.puzzleArray, {taken: false});
    
    puzzleCard.taken            = true;
    puzzleCard.index            = screenNumber - 1;
    puzzleCard.positioned       = puzzleCard.index === puzzleCard.rightPosition;
    this.clientsArray[socketId] = puzzleCard;

    return puzzleCard;
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
    return _.findWhere(this.puzzleArray, {positioned: false}) === undefined;
  }
}

var pM;

var activeUser;
var numUsers = 0;
var COMPLETED_IN = 20 * 1000; // 60s
var RELOAD_IN = COMPLETED_IN + 7000; // 67s
var reset, timeout;

var start = function() {
  pM = new puzzleManager();
  if (pM.puzzleArray.length == numUsers) {
    console.log('[STARTING A NEW GAME]');

  timeout = setTimeout(function() {
      console.log('[TIMEOUT.. you loose]');
      app.io.broadcast('timeout');
    }, COMPLETED_IN);

  reset = setTimeout(function() {
      console.log('[RELOAD]');
      start();
    }, RELOAD_IN);

    var clients = app.io.sockets.clients();

    for (i=0; i < clients.length; i++) {
      app.io.sockets.socket(clients[i].id).emit('welcome', pM.getPuzzleCard(clients[i].id, i+1));
    }
  }
}

app.io.route('connected', function(req) {
  ++numUsers;
  console.log('[%d connected]', numUsers);
  start();
});

app.io.route('click', function(req) {
  if (activeUser) {
    pM.changePuzzleCards(activeUser, req.socket.id);
    req.io.emit('change', pM.clientsArray[req.socket.id]);
    app.io.sockets.socket(activeUser).emit('change', pM.clientsArray[activeUser]);

    if(pM.isPuzzleCompleted()){
      console.log('[COMPLETED]')
      app.io.broadcast('completed');

      clearTimeout(reset);
      clearTimeout(timeout);
      setTimeout(function() {
        console.log('[PREPARING TO PLAY AGAIN]');
        start();
      }, 5 * 1000);
    }

    activeUser = null;
  }else{
    activeUser = req.socket.id
  }
});
