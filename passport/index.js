//const local =require('./localStrategy');
const kakao = require('./kakaoStrategy');
const {User} =require('../models');
//

module.exports = (passport) => {
    passport.serializeUser((user, done) =>{
        //console.log(user);
        done(null, {id: user.id,accessToken:user.accessToken});
    });

    passport.deserializeUser((user,done) => {
        
        User.findOne({
            where: {id:user.id},
        })
            .then(user=> done(null, {id: user.id,accessToken:user.accessToken}))
            .catch(err => done(err));
    });


    //local(passport);
    kakao(passport);
}