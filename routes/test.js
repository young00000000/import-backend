const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../models");
const sequelize = require("sequelize");
const { upload,tokenValidationMiddleware, authenticationToken, verifyToken} = require("./middlewares");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

router.post('/clubUser',async(req,res)=>{
    try{
        const {department,grade,blog,github_url,framework,language,userId,requestRank} = req.body;
        console.log(department,grade,blog,github_url,framework,language,userId)
        await User.update({
            requestRank:requestRank,
        },{
            where:{
                id:userId
            }
        })
        const a = await ClubUser.create({
            department:department,
            grade: grade,
            blog: blog,
            github_url:github_url,
            framework: framework,
            language: language,
            UserId:userId
        })
        const requsetRankUser = await ClubUser.findAll({
            raw:true,
            where:{
                id: a.id
            }
        })

        console.log(requsetRankUser)

    }catch(error){
        res.sendStatus(401).send('레벨 변경 작성 실패')
    }
})


module.exports = router;