import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import redis from "ioredis";
import axios from "axios";
import qs from 'qs';

dotenv.config();
const router = express.Router();

router.post('/kakao/callback', async function (req, res){
    const {code} = req.body;
    console.log(code);
    const key = process.env.SECRET_KEY;
    try { 
        const response = await axios({
            method : 'POST',
            url : 'https://kauth.kakao.com/oauth/token',
            headers : {
                'content-type' : 'application/x-www-form-urlencoded;charset=utf-8'
            },
            data : qs.stringify({
                grant_type : 'authorization_code',
                client_id : process.env.KAKAO_CLIENT_ID,
                redirect_uri : process.env.KAKAO_REDIRECT_URI,
                code : code
            })
        })

        const {access_token} = response.data;

        const userResponse = await axios({
            method : 'GET',
            url : 'https://kapi.kakao.com/v2/user/me',
            headers : {
                Authorization : `Bearer ${access_token}`
            }
        })
        
        const findUser = await prisma.users.findFirst({where : {email : userResponse.data.kakao_account.email}});
        if(findUser){
            const accesstoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : '10m'});
            const refreshtoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : '7d'});
            const token_time = jwt.verify(accesstoken, key);

            res.setHeader('Authorization', `Bearer ${accesstoken}`);
            res.setHeader('Refreshtoken', refreshtoken);
            res.setHeader('Expiredtime', token_time.exp);

            console.log('======성공1======');

            return res.json({message : "로그인 성공"});
        }else {
            const createUser = await prisma.users.create({
                data : {
                    email : userResponse.data.kakao_account.email,
                    username : userResponse.data.kakao_account.profile.nickname,
                    password : 'ok12341234',
                    profileImg : userResponse.data.kakao_account.profile.profile_image_url
                }
            })
            const accesstoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : '10m'});
            const refreshtoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : '7d'});
            const token_time = jwt.verify(accesstoken, key);

            res.setHeader('Authorization', `Bearer ${accesstoken}`);
            res.setHeader('Refreshtoken', refreshtoken);
            res.setHeader('Expiredtime', token_time.exp);
            console.log('======성공2======');
            return res.json({message : "회원가입 성공"});
        }
    }catch(err) {
        console.error(err);
        return res.status(500).json({message : 'Server_Error'});
    }
})
/**
 * {
  id: 3218322262,
  connected_at: '2023-12-10T12:52:28Z',
  properties: {
    nickname: '이찬영',
    profile_image: 'http://k.kakaocdn.net/dn/byciWz/btsAYHRZIp1/ksVmh1tVepeFOQnwQUg8Ek/img_640x640.jpg',
    thumbnail_image: 'http://k.kakaocdn.net/dn/byciWz/btsAYHRZIp1/ksVmh1tVepeFOQnwQUg8Ek/img_110x110.jpg'
  },
  kakao_account: {
    profile_nickname_needs_agreement: false,
    profile_image_needs_agreement: false,
    profile: {
      nickname: '이찬영',
      thumbnail_image_url: 'http://k.kakaocdn.net/dn/byciWz/btsAYHRZIp1/ksVmh1tVepeFOQnwQUg8Ek/img_110x110.jpg',
      profile_image_url: 'http://k.kakaocdn.net/dn/byciWz/btsAYHRZIp1/ksVmh1tVepeFOQnwQUg8Ek/img_640x640.jpg',
      is_default_image: false
    },
    has_email: true,
    email_needs_agreement: false,
    is_email_valid: true,
    is_email_verified: true,
    email: 'yab0403@kakao.com'
  }
}
 */
export default router;