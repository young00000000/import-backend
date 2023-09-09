const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../../models");
const sequelize = require("sequelize");
const { notice,upload,tokenValidationMiddleware, authenticationToken, verifyToken} = require("./middlewares");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

router.post('/',verifyToken,async(req,res)=>{
    const user = req.user;
    console.log("user: ",user,"user.userId: ",user.userId)

    const requsetRank = req.query.requsetRank;

    //clubUser 생성여부 확인
    const clubUser = await ClubUser.findOne({
        raw:true,
        where:{
            UserId:user.userId,
        }
    }).catch(error=> {
        console.error(`Error occurred while fetching ClubUser: ${error}`);
    })

    try {

        if(clubUser){
            //clubUser 생성되어있음 => 기존 정보 업데이트
            await ClubUser.update({
                department:req.body.department,
                grade: req.body.grade,
                blog:req.body.blog ,
                github_url:req.body.github_url,
                framework:req.body.framework ,
                language:req.body.language,
    
            },{
                where:{
                    UserId:user.userId
                }
            }).catch(error=> {
                console.error(`Error occurred while updating ClubUser: ${error}`);
            })
            
            await User.update({
                email:req.body.email,
                requestRank:requsetRank
            },{
                where:{
                    id:user.userId
                }
            }).catch(error=> {
                console.error(`Error occurred while updating User: ${error}`);
            })
        }else if(!clubUser){
            //clubUser 데이터 없음 => 생성
    
            await ClubUser.create({
                department:req.body.department,
                grade: req.body.grade,
                blog:req.body.blog ,
                github_url:req.body.github_url,
                framework:req.body.framework ,
                language:req.body.language,
                UserId:user.userId
            }).catch(error=> {
                console.error(`Error occurred while creating ClubUser: ${error}`);
            })
    
            await User.update({
                email:req.body.email,
                requestRank:requsetRank
            },{
                where:{
                    id:user.userId
                }
            }).catch(error=> {
                console.error(`Error occurred while updating User: ${error}`);
            })
        }

        res.sendStatus(200)
        
    } catch (error) {
        console.log(error)
        res.sendStatus(304)
        
    }

    


})


module.exports = router;