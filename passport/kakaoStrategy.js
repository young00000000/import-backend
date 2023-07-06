const KakaoStrategy = require('passport-kakao').Strategy;
const passport = require('passport');
const {User, ClubUser} = require('../models');
const express = require("express");


module.exports = (passport) => {
    console.log(123);
    passport.use(new KakaoStrategy({
        clientID:process.env.KAKAO_ID,
        callbackURL:'/auth/kakao/callback',
    }, async (accessToken, refreshToken, profile, done)=> {
        try {
           
            const exUser = await User.findOne({  //가입이력 확인
                where: {
                    kakaoId: profile.id,
                    provider: 'kakao'
                }});
                console.log("test");
            if (exUser) {
                console.log(789)
                done(null, exUser);

            } else {
                console.log(000)
                const newUser = await User.create({ //새 유저 생성
                    email: profile._json?.kakao_account.email,//nullish라 판단하면 에러가아닌 undefined 출력
                    nick_name: profile.displayName,
                    kakaoId: profile.id,
                    //rank:"common", 동아리 회원이 될때 랭크 생성 => 여기서 랭크 안넣음
                    provider: 'kakao',
                    rank:1, //그냥 유저는 1(=기본값)
                });
                done(null, newUser);
            }

        }catch (error) {
            console.error(error);
            done(error);
        }
    }));

};

