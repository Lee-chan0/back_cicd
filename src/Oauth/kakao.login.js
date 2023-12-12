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

router.get('/callback', async function (req, res){
    const {code} = req.query;
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
        const findUser = await prisma.users.findFirst({where : {email : userResponse.data.kakao_acount.email}});
        if(findUser){
            const token = jwt.sign({userId : findUser.userId}, key, {expiresIn : '10m'});
            const token_time = jwt.verify(token, key);

            res.setHeader('Authorization', token);
            res.setHeader('Expiredtime', token_time.exp);

            return res.json({message : "로그인 성공"}).redirect('http://localhost:3000/auth/kakao/callback')
        }else {
            const createUser = await prisma.users.create({
                data : {
                    email : userResponse.data.kakao_acount.email,
                    username : userResponse.data.kakao_acount.profile.nickname,
                    password : 'ok12341234',
                    profileImg : userResponse.data.kakao_acount.profile.profile_image_url
                }
            })
            const token = jwt.sign({userId : createUser.userId}, key, {expiresIn : '10m'});
            const token_time = jwt.verify(token, key);

            res.setHeader('Authorization', token);
            res.setHeader('Expiredtime', token_time.exp);

            return res.json({message : "회원가입 성공"}).redirect('http://localhost:3000/auth/kakao/callback')

        }
        // console.log(userResponse.data);

        return res.redirect('http://localhost:3000/auth/kakao/callback');
    }catch(err) {
        console.error(err);
        return res.status(500).json({message : 'Server_Error'});
    }
})

export default router;