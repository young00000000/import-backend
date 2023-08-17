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
const frontURL =  'http://localhost:3000';

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
    try{
        let logout = await axios({
            method:'post',
            url:'https://kapi.kakao.com/v1/user/unlink',
            headers:{
              'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
          });
          await User.update({
            accessToken: null,
            refreshToken:null,
          })
    }catch(error){
        res.sendStatus(403).send("카카오 요청 실패")
    }
    
    res.cookie('accessToken','',{maxAge:0}); //쿠키 만료 10분
    res.cookie('refreshToken','',{maxAge:0});
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
    failureRedirect: frontURL,
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
    const refreshUUID = uuidv4();

    const refreshToken = jwt.sign({
            refreshId:refreshUUID, //고유한 난수를 사용하고싶어서 uuid 사용
        },process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '12h', //기간 12시간
        }
    );



    console.log("token: " + accessToken);
    console.log("refresh: " + refreshToken);

    res.cookie('accessToken',accessToken,{maxAge:60*180*1000}); //쿠키 만료 180분
    res.cookie('refreshToken',refreshToken,{maxAge:60*60*12*1000}); //쿠키 만료 12시간

    try {
        await User.update(
            { refreshToken: refreshUUID },
            { where:{
                    id:{ [Op.eq]:loggedInUser[0].id } ,
                } }
        );
    } catch (error) {
        console.error("Error occurred while updating refreshToken:", error);
        res.sendStatus(500);
        return;
    }


    res.redirect(frontURL);

});

router.get("/tokenverification",verifyToken, (req, res) => {
    console.log("req.headers[accesstoken]: ",req.headers["accesstoken"])
    console.log("req.headers[refreshtoken]: ",req.headers["refreshtoken"])
    
    const accessToken = req.headers["accesstoken"] || req.cookies.accessToken;
    const refreshToken = req.headers["refreshtoken"] || req.cookies.refreshToken;
    /*if (!accessToken ) {
        return res.sendStatus(400); // Bad Request
    }*/
    res.setHeader("accesstoken", accessToken);
    res.setHeader("refreshtoken", refreshToken);
    /*유저 정보가 바뀌었을 땐 토큰 다시 발급하는걸 어케 해야겟넹
    const user = await User.findOne({
        attributes:[nick_name,id,kakaoId,rank]
    })
    */
   //console.log("req.userreq.userreq.userreq.userreq.userreq.user: ",req.user)

    const user = {
        nick_name: req.user.nick_name,
        userId: req.user.userId,
        kakaoId: req.user.kakaoId,
        rank: req.user.rank,
      };
    console.log("/tokenverification: ",user);
    res.json(user);
    
     // Success
});
module.exports = router;

