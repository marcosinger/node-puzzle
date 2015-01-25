$(function() {
  var socket = io.connect("http://10.0.1.5:3001");
  var $card = $('#card');
  var cardOptions;

  var fillCard = function(data) {
    cardOptions = {
      id: data.id,
      color: data.color,
      position: data.position,
      path: data.path,
      rightPosition: data.rightPosition,
      positioned: data.positioned
    }

    $card.css({background: cardOptions.color, display: 'none'});
    $card.find('h1').text(cardOptions.path);
    $card.fadeIn();
    $card.css('display', 'table');
    $card.removeAttr('data-state');

    if(cardOptions.positioned){
      $card.attr('data-state', 'right-position');
    }else{
      $card.attr('data-state', 'wrong-position');
    }

    setTimeout(function(){$card.removeAttr('data-state')}, 5* 1000);
  }

  socket.on('welcome', fillCard);
  socket.on('change', fillCard);

  $card.on('click', function(e){
    e.preventDefault();
    socket.emit('click', cardOptions);
    $(this).attr('data-state', 'selected');
  });

});
