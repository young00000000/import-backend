var createError = require('http-errors');
var sequelize = require('./models').sequelize;
var express = require('express');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./passport');
var path = require('path');
var logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const testRouter = require('./routes/test');

const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userManagementRouter = require('./routes/admin/userManagement')
const rankManagementRouter = require('./routes/admin/rankManagement');


var app = express();
sequelize.sync();
passportConfig(passport);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set("trust proxy", 1);
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
}));
app.use(cors({
  origin:true,
  credentials:true,
  optionsSuccessStatus: 200,
}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/post',postRouter);
app.use('/test',testRouter);

app.use('/admin/userManagement',userManagementRouter);
app.use('/admin/rankManagement',rankManagementRouter);
app.use('/image', express.static(path.join(__dirname, 'image')));




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
