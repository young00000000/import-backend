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
const { error } = require("winston");
const corsOptions = {
    origin: 'http://localhost:4000',
  };
const router = express.Router();

/** 요청레벨이 있는 user목록 */
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
/** 요청레벨이 있는사람 띄워주기 */
router.get('/',async(req,res)=>{
    const users = await requestRankUsers();
    console.log(users);
    return res.json(users);
})

//레벨 바꾸기, 이거끝나면 accessToken도 다시 발급
router.post('/changeRank',async(req,res)=>{
    console.log("changeRanks:으아아ㅏ아아아아아아아ㅏ아아아아아아앙ㅇ\n",req.body.changeRanks);

    
    try{
        
        for(const item of req.body.changeRanks){
            /*
            1. 기존 랭크 1, 요청랭크 2 이상일때 ClubUser 생성
            2. 기존 랭크 2 이상, 요청랭크 1일때 ClubUser 삭제
            */
            const {userId,changeRank}=item;
            const user = await User.findOne({
                raw: true,
                where:{
                    id:userId
                }
            })
            
            if(user.requestRank == changeRank || user.requestRank == null){
                if(user.rank == 1 && changeRank >=2){
                    const clubUserData = await ClubUser.findOne({
                        raw:true,
                        where:{
                            UserId:userId
                        }
                    })
                    //클럽유저데이터가 없다면
                    if(!clubUserData){
                        await ClubUser.create({
                            UserId:userId
                        })
                    }
                }else if(user.rank >=2 && changeRank==1){
                    //일반회원으로 강등시 클럽유저데이터는 필요없기때문에 삭제해준다.
                    await ClubUser.destroy({
                        where:{
                            UserId:userId
                        }
                    })
                }
                
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
    
            }else{
                throw new Error('요청레벨이 null이 아니거나 요청레벨과 바꾸는 레벨이 다릅니다.');
            }
        }
        const users = await requestRankUsers();
        console.log(users);
        res.json(users);
    

    }catch(error){
        console.error('Error updating userRank:', error);
        res.status(403).send('랭크 변경 중 오류가 발생하였습니다.'); 
    }
})

//반려하기
router.post('/reject/:userId',async(req,res)=>{
    console.log('반려 요청이 들어옴');
    try{
        //반려기때문에 요청레벨을 지운다.
        await User.update({
            requestRank:null
        },{
            where:{
                id:req.params.userId
            }
        }).catch(error);

        const userRank = await User.findOne({
            attributes:['rank'],
            raw:true,
            where:{
                id:req.params.userId
            }
        });
        //만약 일반유저가 신청한거였다면 저장되어있던 clubuser 데이터가 필요없으니까 지운다.
        if(userRank == 1){
            await ClubUser.destroy({
                where:{
                    UserId:req.params.userId,
                }
            })
        };
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