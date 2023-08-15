const { RootPost, RootComment, User,ListPost,CardPost,ListPostComment,ProjectComment,PatchNoteComment,CardPostComment, Project,PatchNote, ClubUser} = require("../../models");
const express = require('express');
const passport = require('passport');
const jwt =require("jsonwebtoken")
const { v4: uuidv4 } = require('uuid');
const {Sequelize,Op} = require("sequelize");
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const cors = require('cors');
const axios = require('axios');
const { fileLoader } = require("ejs");
const { error } = require("winston");
const corsOptions = {
    origin: 'http://localhost:4000',
  };

const router = express.Router();


const userdatas = async ()=>{
    //일반 회원 데이터
    const commonUsers = await User.findAll({
      attributes:['id','requestRank','email','nick_name','profileImg','rank','createdAt'],
      where:{
        rank:1
      },
      raw:true,
      });

      //const transaction = await sequelize.transaction()
    //한명의 유저에게 여러개을 클럽유저가 생성되어있을 수 있기때문에 확인후 최근거 한개만 남겨둔다.
    // sequelize.transaction을 사용하여 트랜잭션을 관리합니다.
await sequelize.transaction(async (transaction) => {
  // ClubUser 테이블에서 UserId 별로 최대 createdAt 값을 찾습니다.
  const toDelete = await ClubUser.findAll({
    attributes: [
      'UserId',
      [Sequelize.fn('max', Sequelize.col('createdAt')), 'MaxCreatedAt'],
    ],
    group: ['UserId'],
    transaction,
  });

  for (const entry of toDelete) {
    try {
      // 삭제할 조건을 설정하여 ClubUser 테이블에서 해당 레코드를 삭제합니다.
      await ClubUser.destroy({
        where: {
          UserId: entry.UserId,
          createdAt: {
            [Op.ne]: entry.getDataValue('MaxCreatedAt'), // Op.ne 대신에 entry.getDataValue('MaxCreatedAt')을 사용합니다.
          },
        },
        transaction,
      });
      console.log('삭제했어요'); // 삭제가 성공하면 로그를 출력합니다.
    } catch (error) {
      console.error('삭제 중 에러 발생:', error); // 삭제 중에 에러가 발생하면 에러 메시지를 출력합니다.
    }
  }
});


    //유저 랭크가 2 이상일때 clubUser 데이터 중 최근 1개를 가져온다.
    const notCommonUsers = await User.findAll({
      attributes:['id','requestRank','email','nick_name','profileImg','rank','createdAt'],
      include:[
          {
              model:ClubUser,
              attributes:['id','department','grade','blog','github_url','framework','language','createdAt'],
              required: false,
              //limit: 1, // 최근 1개만 가져오도록 제한 설정
              //order: [['createdAt', 'DESC']], // 최근 데이터 우선 정렬
          }
      ],
      where:{
        rank:{
          [Op.gte]:2
        }
      },
      raw:true,
      nest:true,
      })

    console.log('notCommonUsers: ',notCommonUsers)
    //console.log('userdatas: ',users);
    const convertedcommonUsers = commonUsers.map((user)=>{
      user.userId = user['id'];
      delete user['id'];

      return user;

    })

    const convertednotCommonUsers = notCommonUsers.map((user)=>{
      console.log(user)
      user.userId = user['id'];
      delete user['id'];
      user.department = user['ClubUsers']['department']
      user.grade= user['ClubUsers']['grade']
      user.blog= user['ClubUsers']['blog']
      user.github_url= user['ClubUsers']['github_url']
      user.framework= user['ClubUsers']['framework']
      user.language= user['ClubUsers']['language']
      delete user['ClubUsers'];

      return user;
    })
    const allUsers = [...convertedcommonUsers,...convertednotCommonUsers]
    //console.log('allUsers: ',allUsers);
    
  return allUsers;
    
}
/** User data modify */
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

/** ClubUser data update */
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
      UserId:userId
    }
  }).catch(error);
  return newClubUser;
}
/** ClubUser data create */
const clubUserDataCreate = async(department,grade,blog,github_url,framework,language,userId) =>{
  const newClubUser= await ClubUser.create({
    department:department,
    grade:grade,
    blog:blog,
    github_url:github_url,
    framework: framework,// framework랑 language는 더 해야함. , 구분 등등
    language: language,
    UserId: userId
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
    //console.log('오잉')
    const body = req.body;
    console.log("/userdata/:userId 요청의 body: ",body);
    const userId = req.params.userId;
    try {
        // User 테이블에서 해당 UserId를 가진 데이터 찾기
        
        const userData = await User.findByPk(userId);
        //console.log("userData: ",userData);
        const {email,nick_name,profileImg,rank}=req.body;
        console.log("랭크한번 찍어보자 rank: ",rank);
    
        if (userData) {
          // userData 테이블 데이터 수정
          if (userData.rank !== body.rank){ 
            console.log('레벨 변경!')
            //랭크 변경이 있을 때
            if(userData.requestRank !==null){
              console.log('랭크 변경을 요청해놨어 확인해봐')
              res.sendStatus(401).send('레벨 변경 요청 있음')
            }else{
              //요청 랭크가 없을 때
              console.log('레벨 변경을 하자ㅏㅏㅏㅏㅏ')
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

              //랭크 2이상인 사람을 1로 바꿀때는 ClubUser data를 삭제해야한다.
              if(userData.rank >=2 && body.rank ==1){
                await ClubUser.destroy({
                  where:{
                    UserId:userId
                  }
                })
                .then(console.log('ClubUser data 삭제, userId: ',userId))
                .catch(error);
                console.log('ClubUser data 삭제, userId: ',userId)
              }else if(userData.rank ==1&& body.rank>=2){
                console.log('//랭크 1인 사람을 2 이상으로 바꿀때는 ClubUser data를 생성해야한다.')
                //랭크 1인 사람을 2 이상으로 바꿀때는 ClubUser data를 생성해야한다.
                const existedclubUserData = await ClubUser.findOne({
                  where:{
                    UserId:userId
                  }
                })
                if(!existedclubUserData){
                  //클럽유저 데이터가 없다면
                  await ClubUser.create({
                    UserId:userId
                  })
                  .then(console.log("ClubUser data 생성, userId: ",userId))
                  .catch(error);
                  console.log("ClubUser data 생성, userId: ",userId)
                }
                
              }
            }
            
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
        //여기 null 이라고 뜸
        console.log("clubUserData: ",clubUserData)
        const {department,grade,blog,github_url,framework,language}= clubUserData;
        if (clubUserData) {
          
          // clubUser테이블 데이터 수정 , 변화점이 있을 때만 수정해주려고 확인하는 작업이다.
          if (clubUserData.department !== body.department) {
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            console.log('으악!!!!!!!!: ',newClubUser[0]);
            console.log(body.department)

          }else if(clubUserData.grade !== body.grade){
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            
            console.log('!!!!!newClubUser: ',newClubUser);
          }else if(clubUserData.blog !== body.blog){
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            console.log(newClubUser);
          }else if(clubUserData.github_url !== body.github_url){
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            console.log(newClubUser);
          }else if(clubUserData.language !== body.language){
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            console.log(newClubUser);
          }else if(clubUserData.framework !== body.framework){
            const newClubUser= await clubUserDataModify(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
            console.log(newClubUser);
          }else{
            console.log('동아리 정보 변화 없음.')
          }
        }else if(!clubUserData){
          //기존에 저장되어있는 ClubUser data 가 없으니 새로 생성해줘야한다.
          const newClubUser = await clubUserDataCreate(body.department,body.grade,body.blog,body.github_url,body.framework,body.language,userId);
          console.log(newClubUser);
        }
      } catch (error) {
        console.error('Error updating data:', error);
        throw error;
      }

      const nowUserdata = await User.findAll({
        attributes:['id','requestRank','email','nick_name','profileImg','rank','createdAt'],
        include:[
            {
                model:ClubUser,
                attributes:['id','department','grade','blog','github_url','framework','language','createdAt'],
                required: false,
            }
        ],
        raw:true,
        nest:true,
        where:{
          id:userId
        }
        })
        console.log('users: ',nowUserdata);
  
      const filteredUsers= nowUserdata.map((user) => {
  
      if (!user['ClubUsers']['id']) {
        user.userId = user['id'];
        delete user['id'];
        delete user['ClubUsers'];
      }else if(user['ClubUsers']['id']){
          user.userId = user['id'];
          delete user['id'];
          user.department = user['ClubUsers']['department']
          user.grade= user['ClubUsers']['grade']
          user.blog= user['ClubUsers']['blog']
          user.github_url= user['ClubUsers']['github_url']
          user.framework= user['ClubUsers']['framework']
          user.language= user['ClubUsers']['language']
          delete user['ClubUsers'];
        }
        console.log('user: ',user);
        return user;
      });
      console.log(filteredUsers);
      return res.json(filteredUsers);
})
router.post('/hi/:userId',async(req,res)=>{
  console.log(req.params.userId);
})

//탈퇴
router.post('/withdrawal/:userId', async (req, res) => {

  try {
    const user = await User.findOne({
      attributes: ['kakaoId'],
      raw: true,
      where: {
        id: req.params.userId,
      },
    });
    console.log('탈퇴 user: ', user);

    // 카카오에 연결 끊기 요청
    const withdrawal = await axios({
      method: 'post',
      url: 'https://kapi.kakao.com/v1/user/unlink',
      headers: {
        'Authorization': `KakaoAK ${process.env.SERVICE_APP_ADMIN_KEY}`,
      },
      data: `target_id_type=user_id&target_id=${user.kakaoId}`,
    });
    console.log(withdrawal.data);

    await User.destroy({
      where:{
        id:req.params.userId
      }
    })
    const users = await User.findAll({
      raw:true
    })

    // 카카오 API 호출 완료 후에 응답을 보내기
    res.status(200).json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});



module.exports = router;