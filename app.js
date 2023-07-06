var express = require('express');
var app = express();
var createError = require('http-errors');
var sequelize = require('./models').sequelize;
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
const authRouter = require('./routes/auth');
const noticeRouter = require('./routes/about/notice');
const postRouter = require('./routes/post');

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
    cookie: {
        httpOnly: 'http://localhost:4000/',
        sameSite:'none',
        //maxAge:60*60*1000, 쿠키가 언제 동안 보관될지 시간 설정
        secure: true,
        credentials:true,
        domain:'localhost',

    },
}));
app.use(cors({
    origin:true,
    credentials:true,
    optionsSuccessStatus: 200,
}))
//
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결됨.');
    }).catch((err) => {
    console.error(err);
});
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/about/notice', noticeRouter);
app.use('/post',postRouter);

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
//
//
// module.exports = app;


// 3000 포트로 서버 오픈
app.listen(4000, function() {
    console.log("start! express server on port 4000")
})

