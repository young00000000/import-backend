const express = require('express');
const passport = require('passport');
const jwt =require("jsonwebtoken")
const { verifyToken,authenticationToken,logout,isLoggedIn} = require('./middlewares');
const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const {Op} = require("sequelize");
const {config} = require("dotenv");
const cors = require('cors');
const axios = require('axios');
const corsOptions = {
    origin: 'http://localhost:4000',
  };

const router = express.Router();

router.get('/logout',async(req,res)=>{
    // https://kapi.kakao/com/v1/user/logout
    const accessToken = req.headers['accesstoken'];
    const refreshToken = req.headers['refreshtoken'];
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
  try {
    //console.log(req.user)
    
    
    const ACCESS = await User.findOne({
        attributes:['accessToken'],
        raw:true,
        where:{
            id:req.user.userId
        }
    });
    const ACCESS_TOKEN = ACCESS.accessToken;
    console.log("accessToken: ",ACCESS_TOKEN);
    let logout = await axios({
      method:'post',
      url:'https://kapi.kakao.com/v1/user/unlink',
      headers:{
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    res.cookie('accessToken','',{maxAge:0}); //쿠키 만료 10분
    res.cookie('refreshToken','',{maxAge:0});
    res.redirect('http://localhost:4000');
  } catch (error) {
    console.error(error);
    res.json(error);
  }
  // 세션 정리
  //req.logout();
  
  req.session.destroy();

  
  
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback',passport.authenticate('kakao',{
    failureRedirect: 'http://localhost:4000',
    failureMessage: true,
}),async (req, res) => {
    const kakao = Number(req.user.kakaoId);

    const loggedInUser= await User.findAll({
        raw:true, //쓸데없는 데이터 말고 dataValues 안의 내용만 나옴(궁금하면 옵션빼고 아래 us 사용하는 데이터 주석처리하고 확인)
        attributes:['kakaoId','nick_name','rank','id'],
        where:{
            kakaoId:{ [Op.eq]:kakao } ,
        }
    });

    const accessToken = jwt.sign({
        kakaoId: req.user.kakaoId,
        userId: loggedInUser[0].id,
        nick_name: loggedInUser[0].nick_name,
        rank: loggedInUser[0].rank,
    }, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '10m', //기간 10분
    });

    const refreshToken = jwt.sign({
            uuid:uuidv4(), //고유한 난수를 사용하고싶어서 uuid 사용
        },process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '12h', //기간 12시간
        }
    );



    console.log("token: " + accessToken);
    console.log("refresh: " + refreshToken);

    res.cookie('accessToken',accessToken,{maxAge:60*10*1000}); //쿠키 만료 10분
    res.cookie('refreshToken',refreshToken,{maxAge:60*60*12*1000}); //쿠키 만료 12시간

    try {
        await User.update(
            { refreshToken: refreshToken },
            { where:{
                    id:{ [Op.eq]:loggedInUser[0].id } ,
                } }
        );
    } catch (error) {
        console.error("Error occurred while updating refreshToken:", error);
        res.sendStatus(500);
        return;
    }


    res.redirect('http://localhost:4000');

});

router.get("/tokenverification",verifyToken, (req, res) => {
    console.log("123123");
    const accessToken = req.headers["accesstoken"] || req.cookies.accessToken;
    const refreshToken = req.headers["refreshtoken"] || req.cookies.refreshToken;
    console.log("accessToken", accessToken);
    console.log("refreshtoken", refreshToken);
    if (!accessToken ) {
        return res.sendStatus(400); // Bad Request
    }
    res.setHeader("accesstoken", accessToken);
    res.setHeader("refreshtoken", refreshToken);
    const user = {
        nick_name: req.user.nick_name,
        userId: req.user.userId,
        kakaoId: req.user.kakaoId,
        rank: req.user.rank,
      };
      console.log(user);
    res.json(user);
    
    return res.sendStatus(200); // Success
});
module.exports = router;

