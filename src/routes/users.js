import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import {client} from '../redis/redis.js';
import nodemailer from 'nodemailer';
import cron, { schedule } from 'node-cron';


dotenv.config();

const router = express.Router();

cron.schedule('0 * * * *', async() => {
  await deleteUser();
}, {
  scheduled : true,
  timezone : "Asia/Seoul"
})

async function deleteUser () {
  try{
    const currentDate = new Date();
    console.log(currentDate);

    const deletedAtUser = await prisma.users.findMany({
      where : {
        deletedAt : {
          lte : currentDate
        }
      }
    });

    for (const user of deletedAtUser) {
      await prisma.users.delete({
        where : {
          userId : user.userId
        }
      })
    }

    console.log(`${deletedAtUser.length}명의 데이터가 삭제되었습니다.`)
  }catch(err){
    console.error(err);
    return res.status(500)
  }
}


const userVerificationCodes = {};

// 회원가입
router.post("/signup", async(req, res, next) => {
  const {email, password, username} = req.body;
  try{
    const isExitsEmail = await prisma.users.findFirst({where : {email : email}});
    if(isExitsEmail){return res.status(400).json({message : "이미 가입된 이메일 입니다."})};

    const Authenticationcode = Math.random().toString(36).substring(2, 8);

    const mailer = nodemailer.createTransport({
      service : "gmail",
      auth : {
        user : "yab0403777@gmail.com",
        pass : "atun uixk yiit gcmt",
      }
    });
    const htmlContent = `
    <div style="font-family: 'Arial', sans-serif; max-width: 400px; margin: 20px auto; background-color: #fdfdfd; padding: 20px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); border: 3px solid papayawhip; color: #000; text-align: center;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #000; font-weight: normal;">감정일기에 오신 것을 환영합니다.</h2>
      <p style="font-size: 14px; margin-bottom: 15px;">이메일 인증을 위한 코드가 도착했습니다.</p>
      <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;"> 인증코드: ${Authenticationcode} </p>
      <div style="font-size: 12px; color: #000;">- 감정일기를 즐겨보세요 -</div>
    </div>
  `;
  

  const mailOptions = {
    from : "yab0403777@gmail.com",
    to : email,
    subject : "[감정일기에서 보낸 인증코드]",
    html : htmlContent,
    text : `인증 코드 : ${Authenticationcode}를 입력해주세요.`,
  };

  mailer.sendMail(mailOptions, (error, info) => {
    if(error){
      console.error(error);
      return res.status(500).json({message : "메일 전송도중 Error가 발생했습니다."})
    }
    console.log(`이메일 전송 정보 : ${info.response}`);

    userVerificationCodes[email] = Authenticationcode;

    return res.status(201).json({message : "이메일 전송 완료"});
  })
  }catch(err){
    console.error(err);
    return res.status(500).json({message : "Server Error"})
  }
})


/**
 * @swagger
 * /complete-signup:
 *   post:
 *     summary: 이메일 인증 후, 회원가입 완료
 *     tags:
 *       - Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 유저의 이메일
 *                 example: user@example.com
 *               Authenticationcode:
 *                 type: string
 *                 description: 이메일로 전송된 인증 코드
 *                 example: abcd1234
 *               password:
 *                 type: string
 *                 description: 유저의 비밀번호
 *                 example: password1234
 *               username:
 *                 type: string
 *                 description: 유저의 닉네임
 *                 example: myusername
 *     responses:
 *       '201':
 *         description: 회원가입 성공시
 *         content:
 *           application/json:
 *             example:
 *               message: "myusername님, 회원가입이 완료되었습니다."
 *               data:
 *                 userId: 1
 *                 username: "myusername"
 *                 userType: "Common or K or N or G"
 *                 email: "user@example.com"
 *       '400':
 *         description: 인증 코드 오류시
 *         content:
 *           application/json:
 *             example:
 *               message: "인증 코드가 올바르지 않습니다."
 *       '500':
 *         description: 서버 오류시
 *         content:
 *           application/json:
 *             example:
 *               message: "Server Error"
 */
// 이메일 인증 후, 회원가입 완료 로직
router.post("/complete-signup", async(req, res) => {
  const {email, Authenticationcode, password, username} = req.body;
  try{
    const serverAuthenticationCode = userVerificationCodes[email];

    if(Authenticationcode === serverAuthenticationCode){
      const encryptionPassword = await bcrypt.hash(password, 10);

      const createUser = await prisma.users.create({
        data : {
          email : email,
          password : encryptionPassword,
          username : username
        }
      });

      const userInfo = await prisma.users.findFirst({
        where : {email : email},
        select : {
          userId : true,
          username : true,
          userType : true,
          email : true,
        }
      });
      return res.status(201).json({message : `${createUser.username}님, 회원가입이 완료되었습니다.`, data : userInfo});
    }else {
      return res.status(400).json({message : "인증 코드가 올바르지 않습니다."});
    }
  }catch(err){
    console.error(err);
    return res.status(500).json({message : "Server Error"});
  }
})

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: 로그인
 *     tags:
 *       - Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 유저의 email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: 유저의 password
 *                 example: password1234
 *     responses:
 *       '200':
 *         description: 로그인 성공시
 *         headers:
 *           Authorization:
 *             description: Bearer accesstoken
 *             schema:
 *               type: string 
 *               example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           Refreshtoken:
 *             description: Refreshtoken
 *             schema:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         content:
 *           application/json:
 *             example:
 *               msg: "username님, 환영합니다."
 *               profileImage: "userprofileIMG.jpg"
 *       '400':
 *         description: 패스워드 불일치
 *         content:
 *           application/json:
 *             example:
 *               msg: "존재하지 않는 email입니다. or 비밀번호가 일치하지 않습니다."
 */

// 일반 로그인
router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const key = process.env.SECRET_KEY;

    const findUser = await prisma.users.findFirst({ where: { email: email } });
    if (!findUser) {
      return res.status(400).json({ msg: `존재하지 않는 email입니다.` });
    }

    // const decodedPassword = await bcrypt.compare(password, findUser.password);

    // if (!decodedPassword) {
    //   return res.status(400).json({ msg: "비밀번호가 일치하지 않습니다." });
    // }

    let profileImage = findUser.profileImg;

    const accessToken = jwt.sign({ userId: findUser.userId }, key, {
      expiresIn: "30m",
    });

    const refreshToken = jwt.sign({ userId: findUser.userId }, key, {
      expiresIn: "7d",
    });

    await client.set(`RefreshToken:${findUser.userId}`, refreshToken, "EX", 7 * 24 * 60 * 60 );

    const access_token_time = jwt.verify(accessToken, process.env.SECRET_KEY);
    
    res.set("Expiredtime", access_token_time.exp);
    res.set("Authorization", `Bearer ${accessToken}`);
    res.set("Refreshtoken", `${refreshToken}`);

    return res.status(200).json({msg: `${findUser.username}님 환영합니다.`, profileImage: profileImage,});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: `server Error` });
  }
});
/**
 * @swagger
 * /logout:
 *   post:
 *     summary: 로그아웃
 *     tags:
 *       - Login
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *       '200':
 *         description: 로그아웃 성공시
 *         headers:
 *           Authorization:
 *             description: 토큰 비우기
 *             schema:
 *               type: string
 *               example: ""
 *           Refreshtoken:
 *             description: 토큰 비우기
 *             schema:
 *               type: string
 *               example: ""
 *       content:
 *         application/json:
 *           example:
 *             msg: "로그아웃 되었습니다."
 */
// 로그아웃
router.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const result = await client.del(`RefreshToken:${userId}`);
    console.log(`키 삭제 결과: ${result}`);

    res.setHeader(`Authorization`, "");
    res.setHeader(`Refreshtoken`, "");

    return res.status(200).json({ msg: "로그아웃 되었습니다." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server Error" });
  }
});

/**
 * @swagger
 * /myInfo:
 *   get:
 *     summary: 내 정보 조회
 *     tags:
 *       - User
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *       '200':
 *         description: 해당 유저 정보 조회
 *         content:
 *           application/json:
 *             example:
 *               msg: '{"data":{"userId":1,"username":"홍길동","email":"example@naver.com","profileImg":"image.jpg"}}'
 *       '400':
 *         description: 해당 유저가 없을때
 *         content:
 *           application/json:
 *             example:
 *               msg: "존재하지 않는 유저입니다."
 */

// 내 정보 조회
router.get("/myInfo", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      username: true,
      email: true,
      profileImg: true,
      userType : true,
    },
  });
  if (!user) {
    return res.status(400).json({ msg: `존재하지 않는 유저입니다.` });
  }

  return res.status(200).json({ data: user })
});

/**
 * @swagger
 * /token:
 *   get:
 *    summary: accesstoken만료시 refreshtoken을 이용한 재발급
 *    tags:
 *      - Token
 *    parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *    responses:
 *      '201':
 *         description: 토큰 발급 완료
 *         content:
 *           application/json:
 *             example:
 *               message: "AccessToken 발급 완료"
 *      '401':
 *         description: 토큰 발급 실패 (RefreshToken 불일치)
 *         content:
 *            application/json:
 *              example:
 *                message: "비정상적인 접근입니다. 자동으로 로그아웃 됩니다."
 */

// AccessToken 재발급 로직
router.get('/token', authMiddleware, async(req, res, next) => {
  const {userId} = req.user;
  const {refreshtoken} = req.headers;
  const key = process.env.SECRET_KEY;

  const storedRefreshToken = await client.get(`RefreshToken:${userId}`);

  if(refreshtoken !== storedRefreshToken){
    await client.del(`RefreshToken:${userId}`);
    res.setHeader('Authorization', '');
    res.setHeader('Refreshtoken', '');
    return res.status(401).json({message : "비정상적인 접근입니다. 자동으로 로그아웃 됩니다."}); 
  }else {
    const newAceessToken = jwt.sign({userId : +userId}, key, {expiresIn : '30m'});
    const newRefreshToken = jwt.sign({userId : +userId}, key, {expiresIn : '7d'});

    const newAccessToken_time = jwt.verify(newAceessToken, key);

    await client.set(`RefreshToken:${userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60 );

    res.setHeader('Authorization', `Bearer ${newAceessToken}`);
    res.setHeader('Refreshtoken', newRefreshToken);
    res.setHeader('Expiredtime', newAccessToken_time.exp);

    return res.status(201).json({message : "AccessToken 발급 완료"});
  }
});

/**
 * @swagger
 * /myInfo/editmyInfo:
 *   patch:
 *     summary: 내 정보 수정 기능
 *     tags:
 *       - User
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 변경할 사용자 이름
 *               profileImg:
 *                 type: string
 *                 description: 변경할 프로필 이미지 URL
 *               password:
 *                 type: string
 *                 description: 현재 비밀번호
 *               newPassword:
 *                 type: string
 *                 description: 새로운 비밀번호
 *     responses:
 *       '201':
 *         description: 수정 완료
 *         content:
 *           application/json:
 *             example:
 *               message: "수정이 완료되었습니다."
 *       '400':
 *         description: 소셜 로그인 사용자
 *         content:
 *           application/json:
 *             example:
 *               message: "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다. or 비밀번호가 틀립니다."
 */

// 내 정보 수정 API 
router.patch('/myInfo/editmyInfo', authMiddleware, async(req, res, next) => {
  try{
    const {userId} = req.user;
    const {username, profileImg, password, newPassword} = req.body;

    if(password){
      const userPWinfo = await prisma.users.findFirst({where : {userId : +userId}});
      if(userPWinfo.userType === 'K' || userPWinfo.userType === 'G' || userPWinfo.userType === 'N'){
        return res.status(400).json({message : "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다."})
      }
      const decodedPW = await bcrypt.compare(password, userPWinfo.password);

      if(!decodedPW)
      {return res.status(400).json({message : "비밀번호가 틀립니다."})};

      const encryptionPassword = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({where : {userId : +userId},
        data : {
          password : encryptionPassword,
        }})
    }

    const editmyInfo = await prisma.users.update({
      where : {userId : +userId},
      data : {
        username : username,
        profileImg : profileImg
      }
    })

    return res.status(201).json({message : "수정이 완료되었습니다."});
  }catch(err) {
    console.error(err);
    return res.status(500).json({message : "Server Error"});
  }
});
/**
 * @swagger
 * /signoff:
 *   delete:
 *     summary: 내 계정 삭제
 *     tags:
 *       - User
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *       '201':
 *         description: 탈퇴 처리 OK
 *         content:
 *           application/json:
 *             example:
 *               message: "탈퇴처리 되었습니다."
 */



// 회원 탈퇴 API (탈퇴에 필요한 보류시간 ex.15일뒤에 삭제되는 로직 생각)
router.delete('/signoff', authMiddleware, async(req, res, next) => {
  try{
    const {userId} = req.user;

    // 현재 시간 기준으로 15일뒤의 날짜 계산
    const currentDate = new Date();
    const deleteDate = new Date(currentDate);

    deleteDate.setDate(deleteDate.getDate() + 1);

    deleteDate.setUTCHours(deleteDate.getUTCHours() + 9);

    const softDelete = await prisma.users.update({
      where : {userId : +userId},
      data : {
        deletedAt : deleteDate
      }
    })

    return res.status(201).json({message : "탈퇴처리가 완료되었습니다. 15일 동안 회원정보가 보류됩니다."});
  }catch(err){
    console.error(err);
    return res.status(500).json({message : "Server Error"});
  }
});

export default router;