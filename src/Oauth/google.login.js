import express from "express";
import { prisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authMiddleware from "../middleware/auth.middleware.js";
import redis from "ioredis";
import axios from 'axios';

const router = express.Router();
dotenv.config();

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

router.post('/google/callback', async(req, res, next) => {
    const key = process.env.SECRET_KEY;
    const {code} = req.body;
    console.log('code=======', code);
    const resp = await axios.post(GOOGLE_TOKEN_URL, {
        code : code,
        client_id : process.env.GOOGLE_CLIENT_ID,
        client_secret : process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri : process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI,
        grant_type : `authorization_code`
    });
    const resp2 = await axios.get(GOOGLE_USERINFO_URL, {
        headers : {
            authorization: `Bearer ${resp.data.access_token}`
        }
    });

    const findUser = await prisma.users.findFirst({where : {email : resp2.data.email}});
    if(findUser){
        const accesstoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : '30m'});
        const refreshtoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : '7d'});

        const access_token_time = jwt.verify(accesstoken, key);

        res.setHeader('Authorization', accesstoken);
        res.setHeader('Refreshtoken', refreshtoken);
        res.setHeader('Expiredtime', access_token_time.exp);

        return res.status(201).json({message : "로그인 성공"});
    }else {
        const createUser = await prisma.users.create({
            data : {
                email : resp2.data.email,
                password : '124okOK1234',
                username : resp2.data.name,
                profileImg : resp2.data.picture
            }
        })
        const accesstoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : '30m'});
        const refreshtoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : '7d'});

        const access_token_time = jwt.verify(accesstoken, key);

        res.setHeader('Authorization', accesstoken);
        res.setHeader('Refreshtoken', refreshtoken);
        res.setHeader('Expiredtime', access_token_time.exp);

        return res.status(201).json({message : "회원가입 성공"})
    }
})

export default router;