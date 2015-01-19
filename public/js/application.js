$(function() {
  var socket = io.connect("http://10.0.1.2:3000");
  var $card = $('#card');
  var cardOptions;

  var fillCard = function(data) {
    cardOptions = {
      id: data.id,
      position: data.position,
      color: data.color
    }

    console.log(cardOptions)

    $card.css({background: cardOptions.color, display: 'none'});
    $card.find('h1').text(cardOptions.position);
    $card.fadeIn();
    $card.css('display', 'table');
    $card.removeAttr('data-state');
  }

  socket.on('welcome', fillCard);
  socket.on('change', fillCard);

  $card.on('click', function(e){
    e.preventDefault();
    socket.emit('click', cardOptions);
    $(this).attr('data-state', 'selected');
  });
});
