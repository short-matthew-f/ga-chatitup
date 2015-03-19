var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userNames = {}, userIds = {};
var messages = [];
var historySize = 50;

app.use('/css', express.static('public/css'));
app.use('/stylesheets', express.static('public/stylesheets'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function (socket) {
  io.to(socket.id).emit('server current users', Object.keys(userIds));
  io.to(socket.id).emit('server current messages', messages);

  socket.on('disconnect', function () {
    var name = userNames[socket.id];
    delete userNames[socket.id];
    delete userIds[name];

    io.emit('server remove user', {
      id: socket.id,
      name: name
    });
  });

  socket.on('user new message', function (message) {
    var newMessage = {
      username: userNames[socket.id],
      content: message
    };

    messages.push(newMessage);
    if (messages.length > historySize) { messages.shift(); };

    io.emit('server new message', newMessage);
  });

  socket.on('user request name', function (name) {
    if (userIds[name] === undefined) {
      userNames[socket.id] = name;
      userIds[name] = socket.id;

      io.emit('server confirm user', {
        id: socket.id,
        name: name
      });
    } else {
      io.to(socket.id).emit('server reject user');
    };
  });
});

http.listen(3000, function () {
  console.log("Server is now up");
})
