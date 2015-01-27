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
var puzzleArray = [
                  {path: 'A', color: '#7f8c8d', rightPosition: 0, taken: false, positioned: true},
                  {path: 'B', color: '#c0392b', rightPosition: 1, taken: false, positioned: true},
                  {path: 'C', color: '#3498db', rightPosition: 2, taken: false, positioned: true},
                  {path: 'D', color: '#9b59b6', rightPosition: 3, taken: false, positioned: true},
                  {path: 'E', color: '#34495e', rightPosition: 4, taken: false, positioned: true},
                  {path: 'F', color: '#f39c12', rightPosition: 5, taken: false, positioned: true},
                  {path: 'G', color: '#d35400', rightPosition: 6, taken: false, positioned: true},
                  {path: 'H', color: '#2ecc71', rightPosition: 7, taken: false, positioned: true},
                  {path: 'I', color: '#1abc9c', rightPosition: 8, taken: false, positioned: true}
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

var activeUser;
var numUsers = 0;

app.io.route('ready', function(req) {
    req.io.emit('talk', {
        message: 'io event from an io route on the server'
    })
})

app.io.route('connected', function(req) {
  ++numUsers;

  console.log('[NEW USER] - We have %d users connected', numUsers);

  req.socket.emit('welcome', pM.getPuzzleCard(req.socket.id));
});

app.io.route('click', function(req) {
  if (activeUser) {
    pM.changePuzzleCards(activeUser, req.socket.id);
    req.io.emit('change', pM.clientsArray[req.socket.id]);
    app.io.sockets.socket(activeUser).emit('change', pM.clientsArray[activeUser]);

    activeUser = null;
  }else{
    activeUser = req.socket.id
  }
});