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
            requestRank:req.body.requestRank,
        },{
            where:{
                id:req.body.userId
            }
        })
        const a = await ClubUser.create({
            department:req.body.department,
            grade: req.body.grade,
            blog: req.body.blog,
            github_url:req.body.github_url,
            framework: req.body.framework,
            language: req.body.language,
            UserId:req.body.userId
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