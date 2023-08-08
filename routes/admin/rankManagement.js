const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../../models");
const express = require('express');
const passport = require('passport');
const jwt =require("jsonwebtoken")
const { v4: uuidv4 } = require('uuid');
const {Op} = require("sequelize");
const {config} = require("dotenv");
const cors = require('cors');
const axios = require('axios');
const { update } = require("../../models/user");
const corsOptions = {
    origin: 'http://localhost:4000',
  };

const router = express.Router();
const requestRankUsers = async()=>{
    const users =  await User.findAll({
        raw:true,
        attributes:['id','email','nick_name','rank','requestRank','createdAT'],
        where:{
            requestRank:{
                [Op.ne]: null
            }
        }
    })
    users.forEach((obj) => {
        obj.userId = obj["id"];
        delete obj["id"];
    });
    console.log('users: ',users)
    return users;

}
//요청레벨이 있는사람 띄워주기
router.get('/',async(req,res)=>{
    const users = await requestRankUsers();
    console.log(users);
    return res.json(users);
})

//레벨 바꾸기
router.post('/changeRank',async(req,res)=>{
    console.log("changeRanks:으아아ㅏ아아아아아아아ㅏ아아아아아아앙ㅇ\n",req.body.changeRanks);
    try{
        
        for(const item of req.body.changeRanks){
            const {userId,changeRank}=item;
            const user = await User.findOne({
                raw: true,
                where:{
                    id:userId
                }
            })
            //console.log('req: ',user.requestRank);
            //console.log('cha: ',changeRank);
            await User.update({
                rank: changeRank,
                requestRank: null,
            },{
                where:{
                    id:userId
                }
            });

            const nowUser = await User.findOne({
                raw: true,
                where:{
                    id:userId
                }
            })
            console.log('결과: ',nowUser);
            const users = await requestRankUsers();
            console.log(users);
            res.json(users);
            /*
            if(user.requestRank===changeRank||user.requestRank===null){
                await User.update({
                    rank: changeRank,
                    requestRank: null,
                },{
                    where:{
                        id:userId
                    }
                });
    
                const nowUser = await User.findOne({
                    raw: true,
                    where:{
                        id:userId
                    }
                })
                console.log('결과: ',nowUser);
                const users = await requestRankUsers();
                console.log(users);
                res.json(users);
            }else{
                console.log(item,'requestRank 와 changeRank 다르다')
                res.sendStatus(401).send('requestRank와 changeRank가 다른 경우 존재')
            }
            */


            
        }
    

    }catch(error){
        console.error('Error updating userRank:', error);
        throw error;
    }
})

//반려하기
router.post('/reject/:userId',async(req,res)=>{
    try{
        await User.update({
            requestRank:null
        },{
            where:{
                id:req.params.userId
            }
        })
        //return res.sendStatus(200).send('반려완료')

    }catch(error){
        console.log('레벨 변경 요청 반려, userId: ',req.params.userId);
        return res.sendStatus(401);
    }
    const users = await requestRankUsers();
    console.log(users);
    return res.json(users);


})







module.exports = router;