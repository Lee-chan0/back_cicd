import { OauthRepository } from "../repositories/oauth.repository.js";
import dotenv from 'dotenv';
import axios from "axios";
import qs from 'qs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {client} from '../utils/redisClient.js';

dotenv.config();

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export class OauthService {
    oauthRepository = new OauthRepository();
    kakaoSignupOrSignin = async(code) => {
        const key = process.env.SECRET_KEY;
        
        const response = await axios({
            method : "POST",
            url : "https://kauth.kakao.com/oauth/token",
            headers : {
                "content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
            data : qs.stringify({
                grant_type: "authorization_code",
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                code: code,
            })
        })
        const {access_token} = response.data;

        const userResponse = await axios({
            method : "GET",
            url : "https://kapi.kakao.com/v2/user/me",
            headers : {
                Authorization : `Bearer ${access_token}`,
            },
        })

        const findUser = await this.oauthRepository.findUserByEmail(userResponse.data.kakao_account.email);

        if(findUser.deletedAt){
            return {findUser}
        }

        if(findUser){
            const accesstoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "1h"});
            const refreshtoken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "7d"});

            await client.set(`RefreshToken:${findUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60);

            return {
                accesstoken,
                refreshtoken,
                findUser,
            }
        }else{
            let userType = 'K';
            let userResponseIdString = userResponse.data.id.toString();
            let kakaoIdsubString = userResponseIdString.substring(0, 8);

            const encryptionPassword = await bcrypt.hash(kakaoIdsubString, 10);

            const createUser = await this.oauthRepository.createdUser(
                userResponse.data.kakao_account.email,
                userResponse.data.properties.nickname,
                encryptionPassword,
                userResponse.data.properties.profile_image,
                userType
            )

            const accesstoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : "1h"});
            const refreshtoken = jwt.sign({userId : createUser.userId}, key, {expiresIn : "7d"});

            await client.set(`RefreshToken:${createUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60 );

            return {
                accesstoken,
                refreshtoken
            }
        }
    }

    googleSignupOrSignin = async(code) => {
        let userType = 'G';
        const key = process.env.SECRET_KEY;
        const resp = await axios.post(GOOGLE_TOKEN_URL, {
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI,
            grant_type: `authorization_code`,
        })

        const resp2 = await axios.get(GOOGLE_USERINFO_URL, {
            headers : {
                authorization : `Bearer ${resp.data.access_token}`
            }
        })

        const findUser = await this.oauthRepository.findUserByEmail(resp2.data.email);
        if(findUser) {
            const accesstoken = jwt.sign({ userId: findUser.userId }, key, { expiresIn: '1h' });
            const refreshtoken = jwt.sign({ userId: findUser.userId }, key, { expiresIn: '7d' });

            await client.set(`RefreshToken:${findUser.userId}`, refreshtoken, 'EX', 7 * 24 * 60 * 60);

            return {
                accesstoken,
                refreshtoken,
                findUser
            }
        }else {
            const googleUserId = resp2.data.id.substring(0, 8);
            const encryptionPassword = await bcrypt.hash(googleUserId, 10);

            const createUser = await this.oauthRepository.createdUser(
                resp2.data.email,
                resp2.data.name,
                encryptionPassword,
                resp2.data.picture,
                userType,
            )
            const accesstoken = jwt.sign({ userId: createUser.userId }, key, { expiresIn: '1h' });
            const refreshtoken = jwt.sign({ userId: createUser.userId }, key, { expiresIn: '7d' });

            await client.set(`RefreshToken:${createUser.userId}`, refreshtoken, 'EX', 7 * 24 * 60 * 60);

            return {
                accesstoken,
                refreshtoken
            }
        }
    }

    naverSignupOrSignin = async(code, state) => {
        let userType = 'N';
        const key = process.env.SECRET_KEY;
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;
        const redirectUri = process.env.NAVER_REDIRECT_URI;

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

        const findUser = await this.oauthRepository.findUserByEmail(userInfo.email);
        if(findUser){
            const accesstoken = jwt.sign({ userId: findUser.userId }, key, { expiresIn: "1h" });
            const refreshtoken = jwt.sign({ userId: findUser.userId }, key, { expiresIn: "7d" });

            await client.set(`RefreshToken:${findUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60);

            return {
                accesstoken,
                refreshtoken,
                findUser
            }
        }else {
            const randomPW = Math.random().toString(36).substring(2, 12);
            const hashedRandomPW = await bcrypt.hash(randomPW, 10);
            const createUser = await this.oauthRepository.createdUser(
                userInfo.email,
                userInfo.name,
                hashedRandomPW,
                userInfo.profile_image,
                userType
            )

            const accesstoken = jwt.sign({ userId: createUser.userId }, key, { expiresIn: "1h" });
            const refreshtoken = jwt.sign({ userId: createUser.userId }, key, { expiresIn: "7d" });

            await client.set(`RefreshToken:${createUser.userId}`, refreshtoken, "EX", 7 * 24 * 60 * 60);

            return {
                accesstoken,
                refreshtoken
            }
        }
    }
}