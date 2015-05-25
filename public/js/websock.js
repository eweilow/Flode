var start = function () {
  var websocket = new WebSocket("ws://" + $(location).attr("host"));
 
  // Eventhandler when the websocket is opened.
  websocket.onopen = function () {
    $("#connectionstatus").hide();
    console.log('The websocket is now open.');
  }

  websocket.onmessage = function (event) {
    var data = JSON.parse(event.data);
    console.log(data);
    if (data.type === "picture") {
      var $img = $("<img>");
      $img.attr("src", data.path);
      $img.prependTo($(".files"));
    }
    else if (data.type === "movie") {
      var $vid = $("<video>");
      $vid.attr("width", 250);
      $vid.attr("height", 250);
      $vid.attr("controls", true);
      $("<source>").attr("src", data.path).attr("type", "video/mp4").appendTo($vid);
      $vid.prependTo($(".files"));
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