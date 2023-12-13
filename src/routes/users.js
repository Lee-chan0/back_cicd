import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import redis from "ioredis";

dotenv.config();

const client = new redis({
  host : process.env.REDIS_HOST,
  port : process.env.REDIS_PORT,
  password : process.env.REDIS_PASSWORD
});

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
    console.log(encryptionPassword);

    await prisma.users.create({
      data: {
        email: email,
        password: encryptionPassword,
        username: username,
      },
    });

    const userdata = await prisma.users.findFirst({
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

    const result = await client.del(`RefreshToken:${userId}`)
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
router.get('/token', authMiddleware, async(req, res) => {
  const {userId} = req.user;
  const {authorization, refreshtoken} = req.headers;
  const token = authorization.split(' ')[1];
  const key = process.env.SECRET_KEY;

  console.log('헤더에서 받은 accesstoken : ', token);
  console.log(refreshtoken);

  const storedRefreshToken = await client.get(`RefreshToken:${userId}`);

  if(refreshtoken !== storedRefreshToken){
    return res.status(401).json({message : "비정상적인 접근입니다."})
  }else {
    const newAceessToken = jwt.sign({userId : +userId}, key, {expiresIn : '30m'});
    const newRefreshToken = jwt.sign({userId : +userId}, key, {expiresIn : '7d'});

    const newAccessToken_time = jwt.verify(newAceessToken, key);

    await client.set(`RefreshToken:${userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60 );

    res.setHeader('Expiredtime', newAccessToken_time.exp);
    res.setHeader('Authorization', newAceessToken);
    res.setHeader('Refreshtoken', newRefreshToken);

    return res.status(201).json({message : "AccessToken 발급 완료"});
  }
})

/* 내 정보 수정 API */

/* 회원 탈퇴 API*/

export default router;