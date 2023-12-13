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

// router.get('/googlelogin', (req, res, next) => {
//     let url = `https://accounts.google.com/o/oauth2/v2/auth`;

//     url=url +`?client_id=${process.env.GOOGLE_CLIENT_ID}`
//     url=url +`&redirect_uri=${process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI}`
//     url=url +`&response_type=code`
//     url=url +`&scope=email profile`

//     res.redirect(url);
// });

router.post('/google/callback', async(req, res, next) => {
    const {code} = req.body;
    console.log('code=======', code);
    const resp = await axios.post(GOOGLE_TOKEN_URL, {
        code : code,
        client_id : process.env.GOOGLE_CLIENT_ID,
        client_secret : process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri : process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI,
        grant_type : `authorization_code`
    });
    console.log('-=--------------------------------------------------------------')
    const resp2 = await axios.get(GOOGLE_USERINFO_URL, {
        headers : {
            authorization: `Bearer ${resp.data.access_token}`
        }
    });

    console.log(resp2.data);

    const {name, email, picture} = resp2.data;
    console.log(name)
    console.log(email)
    console.log(picture)

    // const findUser = await prisma.users.findFirst({where : {email : email}});
    // if(findUser){
    //     const token = jwt.sign({userId : findUser.userId}, process.env.SECRET_KEY);
    //     res.setHeader('authorization', token);
    //     return res.status(200).json({message : "로그인에 성공했습니다."})
    // }


    // const user = await prisma.users.create({
    //     data : {
    //         username : name,
    //         email : email,
    //         profileImg : picture
    //     }
    // })

    // const token = jwt.sign({userId : user.userId}, process.env.SECRET_KEY);
    // res.setHeader('authorization', token);
    return res.status(201).json({message : "회원가입 성공"});
})

export default router;