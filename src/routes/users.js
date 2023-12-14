import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import {client} from '../redis/redis.js';

dotenv.config();

const router = express.Router();

// 회원가입
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    const ExistsEmail = await prisma.users.findFirst({
      where: { email: email },
    });
    if (ExistsEmail) {
      return res.status(400).json({ msg: "이미 가입된 email 입니다." });
    }

    const encryptionPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email: email,
        password: encryptionPassword,
        username: username,
      },
    });

    const userdata = await prisma.users.findFirst({
      where : {email : email},
      where : { email },
      select: {
        userId: true,
        username: true,
      },
    });
    return res.status(201).json({ data: userdata }); // 보안적으로 괜찮은지 마지막에 한번 검토할것
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server Error" });
  }
});

// 일반 로그인
router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const key = process.env.SECRET_KEY;

    const findUser = await prisma.users.findFirst({ where: { email: email } });
    if (!findUser) {
      return res.status(400).json({ msg: `존재하지 않는 email입니다.` });
    }

    const decodedPassword = await bcrypt.compare(password, findUser.password);

    if (!decodedPassword) {
      return res.status(400).json({ msg: "비밀번호가 일치하지 않습니다." });
    }

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
    },
  });
  if (!user) {
    return res.status(400).json({ msg: `존재하지 않는 유저입니다.` });
  }

  return res.status(200).json({ data: user })
});

// AccessToken 재발급 로직
router.get('/token', authMiddleware, async(req, res, next) => {
  const {userId} = req.user;
  const {authorization, refreshtoken} = req.headers;
  const token = authorization.split(' ')[1];
  const key = process.env.SECRET_KEY;

  console.log('헤더에서 받은 accesstoken : ', token);
  console.log(refreshtoken);

  const storedRefreshToken = await client.get(`RefreshToken:${userId}`);

  if(refreshtoken !== storedRefreshToken){
    res.setHeader('Authorization', '');
    res.setHeader('Refreshtoken', '');
    return res.status(401).json({message : "비정상적인 접근입니다. 자동으로 로그아웃 됩니다."})
  }else {
    const newAceessToken = jwt.sign({userId : +userId}, key, {expiresIn : '30m'});
    const newRefreshToken = jwt.sign({userId : +userId}, key, {expiresIn : '7d'});

    const newAccessToken_time = jwt.verify(newAceessToken, key);

    await client.set(`RefreshToken:${userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60 );

    res.setHeader('Authorization', newAceessToken);
    res.setHeader('Refreshtoken', newRefreshToken);
    res.setHeader('Expiredtime', newAccessToken_time.exp);

    return res.status(201).json({message : "AccessToken 발급 완료"});
  }
})

// 내 정보 수정 API (Oauth를 사용해서 만든 password는 어떻게 할지 고민하기) 
// 이메일 인증번호 구현도 넣어볼까 // 휴대폰 인증번호는 예민할수도있으니까 ㄴㄴ
// Oauth같은 경우엔 애초에 카카오 아이디 비밀번호로 가입하는 구조이기 때문에 회원정보 수정이 필요없다고 생각
router.patch('/myInfo/editmyInfo', authMiddleware, async(req, res, next) => {
  try{
    const {userId} = req.user;
    const {email, password, username, profileImg} = req.body;

    const editmyInfo = await prisma.users.update({
      where : {userId : +userId},
      data : {
        email : email,
        password : password,
        username : username,
        profileImg : profileImg
      }
    })

    return res.status(201).json({message : "수정이 완료 되었습니다."});
  }catch(err) {
    console.error(err);
    return res.status(500).json({message : "Server Error"});
  }
});




// 회원 탈퇴 API (탈퇴에 필요한 보류시간 ex.15일뒤에 삭제되는 로직 생각)
router.delete('/myInfo/deleteInfo', authMiddleware, async(req, res, next) => {
  try{
    const {userId} = req.user;

    const deleteUser = await prisma.users.delete({where : {userId : +userId}});

    return res.status(201).json({message : "회원탈퇴가 완료되었습니다."});
  }catch(err){
    console.error(err);
    return res.status(500).json({message : "Server Error"});
  }
})
export default router;