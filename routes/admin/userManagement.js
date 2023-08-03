const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../../models");
const express = require('express');
const passport = require('passport');
const jwt =require("jsonwebtoken")
const { v4: uuidv4 } = require('uuid');
const {Op} = require("sequelize");
const {config} = require("dotenv");
const cors = require('cors');
const axios = require('axios');
const corsOptions = {
    origin: 'http://localhost:4000',
  };

const router = express.Router();

//모든 회원 띄워줌
// userId:number
// nick_name:string,
// createdAT:,
// email:string,
// rank:string,
// profileImg:string,
// (여기 아래부터는 동아리 회원일때만 존재.
// 만약 이렇게 같이있는것보다 다른 형식을 원하면 말씀해주세요)
// department:string,
// grade:string,
// blog:string,
// github_url:string,
// framework:string,
// language:string,

const userdatas = async ()=>{
    const users = await User.findAll({
      attributes:['id','email','nick_name','profileImg','rank','createdAt'],
      include:[
          {
              model:ClubUser,
              attributes:['id','department','grade','blog','github_url','framework','language','createdAt'],
              required: false,
          }
      ],
      raw:true,
      nest:true,
      })
      console.log('users: ',users);

    const filteredUsers= users.map((user) => {

    if (!user['ClubUser']['id']) {
      delete user['ClubUser'];

    }else if(user['ClubUser']['id']){
        user.department = user['ClubUser']['department']
        user.grade= user['ClubUser']['grade']
        user.blog= user['ClubUser']['blog']
        user.github_url= user['ClubUser']['github_url']
        user.framework= user['ClubUser']['framework']
        user.language= user['ClubUser']['language']
        user.createdAt= user['ClubUser']['createdAt']
        delete user['ClubUser'];
    }
    console.log('user: ',user);
    return user;
  });
  return filteredUsers;
    
}
const userDataModify = async(email,nick_name,profileImg,userId)=>{
  const newUser = User.update({
    email: email,
    nick_name:nick_name,
    profileImg:profileImg,
  },{
    where:{
      id: userId
    }
  });
  return newUser;
}
const clubUserDataModify = async(department,grade,blog,github_url,framework,language,userId) =>{
  const newClubUser= await ClubUser.update({
    department:department,
    grade:grade,
    blog:blog,
    github_url:github_url,
    framework: framework,// framework랑 language는 더 해야함. , 구분 등등
    language: language,
  },{
    where:{
      id:userId
    }
  })
  return newClubUser;
}

//유저 데이터 띄워주기
router.get('/',async(req,res)=>{
    //const users = userdatas;
    const users = await userdatas();
    console.log(users);
    return res.json(users);
})
//유저데이터 수정
router.post('/userdata/:userId',async(req,res)=>{
    console.log('오잉')
    const body = req.body;
    console.log(body)
    
    try {
        // User 테이블에서 해당 UserId를 가진 데이터 찾기
        const userId = req.params.userId;
        const userData = await User.findByPk(userId);
        console.log("userData: ",userData);
        const {email,nick_name,profileImg,rank}=req.body;
        console.log(email);
    
        if (userData) {
          // userData 테이블 데이터 수정
          if (userData.rank !== body.rank){ 
            if(userData.requestRank !==null){
              console.log('레벨 변경 요청 있음')
              res.sendStatus(401).send('레벨 변경 요청 있음')
            }
            const newUser = await User.update({
              email: email,
              nick_name:nick_name,
              profileImg:profileImg,
              rank:rank,
            },{
              where:{
                id: userId
              }
            })
            .then()
          }else if(userData.nick_name !== body.nick_name){
            const newUsesr = await userDataModify(email,nick_name,profileImg,userId);
            console.log(newUsesr);
          }else if(userData.profileImg !== body.profileImg){
            const newUsesr = await userDataModify(email,nick_name,profileImg,userId);
            console.log(newUsesr);
          }else if(userData.email !== body.email){
            const newUsesr = await userDataModify(email,nick_name,profileImg,userId);
            console.log(newUsesr);
          }else{
            console.log('userData 변화없음')
          }
        }else{
          console.log('유저없음')
          res.sendStatus(401).send('유저없음')
        }
          
    
        // ClubUser 테이블에서 해당 UserId를 가진 데이터 찾기
        const clubUserData = await ClubUser.findOne({ where: { UserId: req.params.userId } });
        console.log("clubUserData: ",clubUserData)
        if (clubUserData) {
          const {department,grade,blog,github_url,framework,language}= clubUserData;
          // clubUser테이블 데이터 수정
          if (clubUserData.department !==body.department) {
            const newClubUser= clubUserDataModify(department,grade,blog,github_url,framework,language,userId);
            console.log(newClubUser);

          }else if(clubUserData.grade !== body.grade){
            const newClubUser= clubUserDataModify(department,grade,blog,github_url,framework,language,userId);
            console.log(newClubUser);
          }else if(clubUserData.blog !== body.blog){
            const newClubUser= clubUserDataModify(department,grade,blog,github_url,framework,language,userId);
            console.log(newClubUser);
          }else if(clubUserData.github_url !== body.github_url){
            const newClubUser= clubUserDataModify(department,grade,blog,github_url,framework,language,userId);
            console.log(newClubUser);
          }else if(clubUserData.language !== body.language){
            const newClubUser= clubUserDataModify(department,grade,blog,github_url,framework,language,userId);
            console.log(newClubUser);
          }else{
            console.log('동아리 정보 변화 없음.')
          }
        }
      } catch (error) {
        console.error('Error updating data:', error);
        throw error;
      }

      const nowUserdata = await userdatas();
      console.log(nowUserdata);
      return res.json(nowUserdata);
})








module.exports = router;