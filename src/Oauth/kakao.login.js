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

// app.get('/', (req, res) => {
//     res.send(`
//         <h1>login</h1>
//         <a href="/login">sign in</a>
//     `)
// });

// app.get('/login', (req, res) => {
//     const url=`https://kauth.kakao.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
//     res.redirect(url);
// });

router.get('/auth/kakao/callback', async function (req, res){
    const {code} = req.query;
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

        const findUser = await prisma.users.findFirst({where : {email : userResponse.data.kakao_account.email}})
        if(findUser){
            const token = jwt.sign({userId : findUser.userId}, key, {expiresIn : '30m'});
            return res.setHeader('authorization', token).redirect('http://localhost:3000/auth/kakao/callback');
        }else {
            await prisma.users.create({
                data : {
                    email : userResponse.data.kakao_account.email,
                    profileImg : userResponse.data.properties.profile_image,
                    username : userResponse.data.properties.nickname
                }
            })
        }

    }catch(err) {
        console.error(err);
        return res.status(500).json({message : 'Server_Error'});
    }
})

export default router;