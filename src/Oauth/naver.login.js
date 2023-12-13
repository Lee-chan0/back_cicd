import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import redis from "ioredis";
import axios from 'axios';
import qs from 'qs';

const NAVER_CLIENT_ID = "xG9Urio7o7JnngV1Lkdt";
const NAVER_CLIENT_SECRET = "sbUPVPtMiY";
const NAVER_REDIRECT_URI = "http://localhost:3000/auth/naver/callback";

const router = express.Router();

router.get('/', (req, res) => {
    return res.send(`
        <a href="/login/naver">log in</a>
    `)
})

router.get("/login/naver", (req, res) => {
  const clientId = NAVER_CLIENT_ID;
  const redirectUri = "http://localhost:3000/callback/naver";
  const state = "random_state";

  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

  res.redirect(naverAuthUrl);
});

router.get("/callback/naver", async (req, res) => {
  const clientId = NAVER_CLIENT_ID;
  const clientSecret = NAVER_CLIENT_SECRET
  const redirectUri = "http://localhost:3000/callback/naver";

  const code = req.query.code;
  const state = req.query.state;

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

  // 네이버 사용자 정보 조회
  const userInfoResponse = await axios.get(
    "https://openapi.naver.com/v1/nid/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const userInfo = userInfoResponse.data.response;

  // 여기에서 userInfo를 사용하여 사용자의 정보를 처리할 수 있습니다.
  console.log(userInfo.email);
  console.log(userInfo.nickname);
  console.log(userInfo.name);
  console.log(userInfo.profile_image);

  res.send(userInfo);
});

export default router;
