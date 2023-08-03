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
//목록
const getdatas = async (table) =>{
    
    const datas = await table.findAll({
        raw: true,
        include: [
            {
                model: User,
                attributes: ["rank", "nick_name"],
                raw: true,
            },
        ],
    });
    
    datas.forEach((obj) => {
        obj.rank = obj["User.rank"];
        obj.nick_name = obj["User.nick_name"];
        delete obj["User.rank"];
        delete obj["User.nick_name"];
        obj.userId = obj["UserId"];
        delete obj["UserId"];
    });
    return datas;
}

//모든 글 띄워주기
router.get('/',async(req,res)=>{
    const cardPosts = getdatas('CardPost');
    const listPosts = getdatas('ListPost')
    const patchNote = getdatas('PatchNote');
    const project = getdatas('Project');
    const rootPost=getdatas('RootPost');

    
})



module.exports = router;