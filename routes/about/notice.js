const { RootPost, RootComment, User } = require("../../models");
const sequelize = require("sequelize");
const { upload,tokenValidationMiddleware, authenticationToken, verifyToken} = require("../middlewares");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const multer = require('multer');

//목록
router.get("/",async function (req, res) {
  try {
    const posts = await RootPost.findAll({
      attributes: ["id", "title", "content", "tagF", "tagS", "tagT", "category", "file", "createdAt", "updatedAt", "deletedAt",],
      raw: true,
      include: [
        {
          model: User,
          attributes: ["rank", "nick_name"],
          raw: true,
        },
      ],
    });
    posts.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });

    console.log({ item: posts });
    res.json({ item: posts }); //배열 안에 내용이 없을때 {item: []} 로 보내짐
  } catch (error) {
    console.error(error);
  }
});

//상세보기 데이터가 없을때는 빈 배열을 보낸다.
router.get("/:id",async (req, res) => {
  try {
    const post = await RootPost.findAll({
      attributes: ["id", "title", "content", "tagF", "tagS", "tagT", "category", "file", "createdAt", "updatedAt", "deletedAt", "UserId"],
      where: {
        id: { [Op.eq]: req.params.id },
      },
      raw: true,
      include: [ //조인
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    });
    post.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }
    //댓글
    const comments = await RootComment.findAll({
      attributes:["id","content", "sequence", "group", "createdAt", "UserId","RootPostId"],
      raw:true,
      where: {
        RootPostId: { [Op.eq]: req.params.id },
      },
      include: [//조인
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    })
    comments.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });
    console.log({ content: post[0],comment:comments });
    res.json({ content: post[0] ,comment:comments});
  } catch (error) {
    console.error(error);
  }
});

//create
router.post("/post",verifyToken, async (req, res) => {
  const body = req.body;
  const user = req.user;

  try {
    const newPost = await RootPost.create({
      title: body.title,
      content: body.content,
      tagF: body.tagF,
      tagS: body.tagS,
      tagT: body.tagT,
      category: body.category,
      file: "",
      UserId: user.userId,
    });

    const nowPost = await RootPost.findAll({
      attributes: ["id", "title", "content", "tagF", "tagS", "tagT", "category", "file", "createdAt", "updatedAt", "UserId"],
      where: {
        id: { [Op.eq]: newPost.id },
      },
      raw: true,
      include: [//조인
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    });
    nowPost.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });
    console.log({ content: nowPost[0] });
    return res.json({ content: nowPost[0] });
  } catch (error) {
    console.error(error);
    return res.sendStatus(401);
  }
});

//update
router.post("/post/:postId", verifyToken,async (req, res) => {
  try {
    const body = req.body;
    const user = req.user;

    await RootPost.update(
      {
        title: body.title,
        content: body.content,
        tagF: body.tagF,
        tagS: body.tagS,
        tagT: body.tagT,
        category: body.category,
        file: "",
        UserId: user.userId,
      },
      {
        where: {
          id: { [Op.eq]: req.params.postId },
        },
      }
    );

    const updatedPost = await RootPost.findAll({
      attributes: ["id", "title", "content", "tagF", "tagS", "tagT", "category", "file", "createdAt", "updatedAt", "UserId"],
      where: {
        id: { [Op.eq]: req.params.postId },
      },
      raw: true,
      include: [ //조인
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    });
    updatedPost.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });
    console.log({ content: updatedPost[0] });
    return res.json({ content: updatedPost[0] });
  } catch (error) {
    console.error(error);
    return res.sendStatus(401);
  }
});
router.post("/comment/:id", verifyToken,async (req, res) => {
  //댓글 작성

  const body = req.body;
  const user = req.user;

  try {
    const result = await RootComment.findOne({
      attributes: [[sequelize.fn("MAX", sequelize.cast(sequelize.col("sequence"), "INTEGER")), "max_sequence"]],
      where: {
        group: body.group,
        RootPostId: req.params.id ,
      },
    });


    const maxSequence = result.get("max_sequence")|| -1;
    const sequence = Number(maxSequence)+1;

    console.log("가장 큰 숫자:", maxSequence);

    const newcomment = await RootComment.create({
      content: body.content,
      group: body.group,
      sequence: sequence,
      UserId: user.userId,
      RootPostId: req.params.id,
    });

    const nowcomment = await RootComment.findAll({
      attributes: ["content", "sequence", "group", "createdAt", "UserId"],
      where: {
        id: { [Op.eq]: newcomment.id },
      },
      raw: true,
      include: [
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    });
    nowcomment.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });
    console.log({ content: nowcomment[0] });
    return res.json({ content: nowcomment[0] });
  } catch (error) {
    console.error(error);
    return res.sendStatus(401);
  }
});
router.post("/comment/:id/:commentId", async (req, res) => {
  //댓글 수정

  const body = req.body;
  try {


    const newcomment = await RootComment.update(
        {
          content: body.content
        },
        {
          where: {
            id: { [Op.eq]: req.params.commentId },
          },
        }
        );

    const nowcomment = await RootComment.findAll({
      attributes: ["content", "sequence", "group", "createdAt", "UserId"],
      where: {
        id: { [Op.eq]: newcomment.id },
      },
      raw: true,
      include: [
        {
          model: User,
          attributes: ["nick_name", "rank"],
        },
      ],
    });
    nowcomment.forEach((obj) => {
      obj.rank = obj["User.rank"];
      obj.nick_name = obj["User.nick_name"];
      delete obj["User.rank"];
      delete obj["User.nick_name"];
    });
    console.log({ content: nowcomment[0] });
    return res.json({ content: nowcomment[0] });
  } catch (error) {
    console.error(error);
    return res.sendStatus(401);
  }
});
router.delete("/post/:id/:commentId", async (req, res) => {
  try{
    await RootComment.destroy({
      where: {
        id: { [Op.eq]: req.params.commentId },
      },
    });
    return res.sendStatus(200);
  }catch (error){
    console.error(error);
    return res.sendStatus(401);
  }

  //삭제하기
});
router.delete("/post/:postId", async (req, res) => {
  try{
    await RootPost.destroy({
      where: {
        id: { [Op.eq]: req.params.postId },
      },
    });
    return res.sendStatus(200);
  }catch (error){
    console.error(error);
    return res.sendStatus(401);
  }

  //삭제하기
});

router.post('/image',upload.single('fileupload'),function (req,res){
  console.log("post")
  console.log(req.file)
  console.log(req.file.path)
  console.log(upload)
  console.log(upload.storage.getFilename)

  res.redirect('/');
})

module.exports = router;
