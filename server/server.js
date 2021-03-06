// Server code goes here
// Initialize main modules
const path = require('path');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Initialize secondary utilities
const routes = require('./controllers');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/connection');
const { urlencoded } = require('express');
const passport = require('passport');

// Set up server
const app = express();
const PORT = process.env.PORT || 3001;
const appStore = new SequelizeStore({ db: sequelize });

const sess = {
  secret: process.env.SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false,
  store: appStore,
};

app.use(session(sess));

// Set up addons
app.use(cookieParser());
app.use(express.json());
app.use(urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

//Initialize passport
app.use(passport.initialize());
app.use(passport.authenticate('session'));
// Run boot scripts
require('./boot/auth');

// Initialize routes
app.use(routes);
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('Connection successful!');
  socket.emit('your id', socket.id);
  socket.on('send message', (body) => {
    io.emit('message', body);
  });
});

// Initiate the sequelize server
sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server initialization complete. Server listening on ${PORT}`);
  });
});
