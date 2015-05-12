var start = function () {
  var websocket = new WebSocket("ws://" + $(location).attr("host"));
 
  // Eventhandler when the websocket is opened.
  websocket.onopen = function () {
    $("#connectionstatus").hide();
    console.log('The websocket is now open.');
  }

  websocket.onmessage = function (event) {
    var data = JSON.parse(event.data);
    if (data.type === "picture") {
      var $img = $("<img>");
      $img.attr("src", data.path);
      $img.appendTo($(".starter-template"));
    }
  }
 
  // Eventhandler when the websocket is closed.
  websocket.onclose = function () {
    $("#connectionstatus").show();
    console.log('The websocket is now closed.');
    delete websocket;
    
    setTimeout(function () { start(); }, 1000);
  };
};

$(document).ready(function () {
  start();
});