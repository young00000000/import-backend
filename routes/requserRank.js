const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../models");
const sequelize = require("sequelize");
const { upload,tokenValidationMiddleware, authenticationToken, verifyToken} = require("./middlewares");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

router.post('/clubUser',async(req,res)=>{
    try{
        const {department,grade,blog,github_url,framework,language,userId} = req.body;
        const requsetRankUser = await ClubUser.create({
            department:department,
            grade: grade,
            blog: blog,
            github_url:github_url,
            framework: framework,
            language: language,
            UserId:userId
        })

    }catch(error){

    }
})





module.exports = router;