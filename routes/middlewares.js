const {User} = require("../models");
const {Op} = require("sequelize");
const jwt = require("jsonwebtoken")
const {v4:uuidv4} = require("uuid")
const multer = require('multer');
exports.isLoggedIn =  (req, res, next) => {
    console.log(req.session);
    if (req.isAuthenticated()) {
        console.log("미들웨어 isLoggedIn")
        next();
    } else {
        console.log("로그인 필요함")
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
};


exports.logout = (req, res) => {
    console.log("미들웨어 로그아웃 위치함")
    req.logout(() => {
        console.log("리다이랙트 슬래쉬")
        res.redirect('/');
    });
};

/*토큰 유효성 검증
1. accessToken 존재 => decode => 유효하면 넘어가고 만료라면 refreshToken검증 => refreshToken 유효시 토큰 두개다 다시 발급해서 전달, 유효하지 않다면 에러
2. accessToken 미존재 => refreshToken 검증 => 유효하면 토큰 두개다 다시 발급, 유효하지않다면 에러
*/

exports.verifyToken = async (req, res, next) => {

    const accessToken = req.headers['accesstoken'];
    const refreshToken = req.headers['refreshtoken'];
    console.log("verifytoken", accessToken, refreshToken);
    // Access token이 있는 경우 검증
    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            console.log("accessToken success");
            req.user = decoded;
            return next();
        } catch (err) {
            // Access token이 만료된 경우, Refresh token 검증
            if (err.name === 'TokenExpiredError' && refreshToken) {
                try {
                    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    const user = await User.findAll({
                        raw:true, //쓸데없는 데이터 말고 dataValues 안의 내용만 나옴(궁금하면 옵션빼고 아래 us 사용하는 데이터 주석처리하고 확인)
                        attributes:['id','nick_name','rank','kakaoId'],
                        where:{
                             refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                        }
                    })


                    const newAccessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
                    const refresh = uuidv4();
                    const newRefreshToken = jwt.sign({refresh}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '12h' });

                    try {
                        await User.update(
                            { refreshToken: refresh },
                            { where:{
                                    refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                                } }
                        );
                        console.log("accessToken failure, refreshToken success");
                    } catch (error) {
                        console.error("Error occurred while updating refreshToken:", error);
                        res.sendStatus(500);
                        return;
                    }
                    res.cookie('accessToken', newAccessToken, { httpOnly: 'http://localhost:3000/' ,maxAge:60*10*1000});
                    res.cookie('refreshToken', newRefreshToken, { httpOnly: 'http://localhost:3000/' ,maxAge:60*60*12*1000});

                    req.user = user;
                    return next();
                } catch (err) {
                    console.error(err);
                    return res.sendStatus(401);
                }
            } else {
                console.error(err);
                return res.sendStatus(402);
            }
        }
    } else if (refreshToken) { // Access token이 없는 경우 Refresh token 검증
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = User.findAll({
                raw:true, //쓸데없는 데이터 말고 dataValues 안의 내용만 나옴(궁금하면 옵션빼고 아래 us 사용하는 데이터 주석처리하고 확인)
                attributes:['id','nick_name','rank','kakaoId'],
                where:{
                    refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                }
            });
            const newAccessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
            const refresh = "updated";
            const newRefreshToken = jwt.sign({refresh}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '12h' });
            try {
                await User.update(
                    { refreshToken: refresh },
                    { where:{
                            refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                        } }
                );

            } catch (error) {
                console.error("Error occurred while updating refreshToken:", error);
                res.sendStatus(500);
                return;
            }
            console.log("accessToken None, refreshToken success");
            res.cookie('accessToken', newAccessToken, { httpOnly: 'http://localhost:3000/',maxAge:60*10*1000 });
            res.cookie('refreshToken', newRefreshToken, { httpOnly: 'http://localhost:3000/' ,maxAge:60*60*12*1000});

            return next();
        } catch (err) {
            console.error(err);
            return res.sendStatus(403);
        }
    } else { // Access token, Refresh token 모두 없는 경우
        return res.sendStatus(404);
    }
};

// 토큰이 새롭게 발급되는 부분이 제거된 미들웨어
exports.authenticationToken = async (req, res, next) => {
    const accessToken = req.headers["accesstoken"];

    const refreshToken = req.headers["refreshtoken"];
    console.log("authen", accessToken, refreshToken)
    // Access token이 있는 경우 검증
    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            req.user = decoded;
            return next();
        } catch (err) {
            // Access token이 만료된 경우, Refresh token 검증
            if (err.name === 'TokenExpiredError' && refreshToken) {
                try {
                    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    user = await User.findAll({
                        raw:true, //쓸데없는 데이터 말고 dataValues 안의 내용만 나옴(궁금하면 옵션빼고 아래 us 사용하는 데이터 주석처리하고 확인)
                        attributes:['id','nick_name','rank','kakaoId'],
                        where:{
                            refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                        }
                    })

                    req.user = user;
                    return next();
                } catch (err) {
                    console.error(err);
                    return res.sendStatus(401);
                }
            } else {
                console.error(err);
                return res.sendStatus(401);
            }
        }
    } else if (refreshToken) { // Access token이 없는 경우 Refresh token 검증
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = User.findAll({
                raw:true, //쓸데없는 데이터 말고 dataValues 안의 내용만 나옴(궁금하면 옵션빼고 아래 us 사용하는 데이터 주석처리하고 확인)
                attributes:['id','nick_name','rank','kakaoId'],
                where:{
                    refreshToken:{ [Op.eq]:decoded.refreshToken } ,
                }
            });
            return next();
        } catch (err) {
            console.error(err);
            return res.sendStatus(401);
        }
    } else { // Access token, Refresh token 모두 없는 경우
        return res.sendStatus(401);
    }
};
var imageFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 서버에 저장될 위치
    cb(null, "./image");
  },
  filename: (req, file, cb) => {
        var mimeType;

        switch (file.mimetype) {
            case "image/jpeg":
                mimeType = "jpg";
                break;
            case "image/jpg":
                mimeType = "jpg";
                break;
            default:
                mimeType = "png";
                break;
        }

    // 서버에 저장될 때 파일 이름
    cb(null, Date.now() + "-" + uuidv4()+"."+mimeType);
    // console.log("file.origianlname"+ file.originalname);
  },
});
exports.upload = multer({ storage: storage, fileFilter: imageFilter })


//랭크 확인 미들웨어

//db 관련 함수