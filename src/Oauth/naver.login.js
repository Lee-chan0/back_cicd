import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import {client} from '../redis/redis.js';
import axios from 'axios';
import qs from 'qs';

dotenv.config();

const router = express.Router();

// router.get('/', (req, res) => {
//     return res.send(`
//         <a href="/login/naver">log in</a>
//     `)
// })

// router.get("/login/naver", (req, res) => {
//   const clientId = NAVER_CLIENT_ID;
//   const redirectUri = "http://localhost:3000/callback/naver";
//   const state = "random_state";

//   const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

//   res.redirect(naverAuthUrl);
// });

router.post("/naver/callback", async (req, res) => {
  const key = process.env.SECRET_KEY;
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const redirectUri = process.env.NAVER_REDIRECT_URI;

  const {code} = req.body;
  const {state} = req.body;

  // 토큰 요청
  const tokenParams = {
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code,
    state: state,
  };

  const tokenResponse = await axios.post(
    "https://nid.naver.com/oauth2.0/token",
    qs.stringify(tokenParams),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const accessToken = tokenResponse.data.access_token;

  const userInfoResponse = await axios.get(
    "https://openapi.naver.com/v1/nid/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const userInfo = userInfoResponse.data.response;

  const findUser = await prisma.users.findFirst({where : {email : userInfo.email}});
  if(findUser){
    const accesstoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "10m"});
    const refreshtoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "7d"});

    await client.set(`RefreshToken:${findUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60 );

    const accesstoken_time = jwt.verify(accesstoken, key);

    res.setHeader('Authorization', `Bearer ${accesstoken}`);
    res.setHeader('Refreshtoken', refreshtoken);
    res.setHeader('Expiredtime', accesstoken_time.exp);

    return res.status(201).json({message : `${findUser.username}님 환영합니다.`});
  }else {
    const createUser = await prisma.users.create({
      data : {
        email : userInfo.email,
        password : '1234567',
        name : userInfo.name,
        userInfo : userInfo.profile_image
      }
    })
    const accesstoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : "10m"});
    const refreshtoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : "7d"});

    await client.set(`RefreshToken:${findUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60 );

    const accesstoken_time = jwt.verify(accesstoken, key);

    res.setHeader('Authorization', `Bearer ${accesstoken}`);
    res.setHeader('Refreshtoken', refreshtoken);
    res.setHeader('Expiredtime', accesstoken_time.exp);

    return res.status(201).json({message : `회원가입 성공`});
  };
});

export default router;