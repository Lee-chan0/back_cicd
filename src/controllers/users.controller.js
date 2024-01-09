import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {UsersService} from '../services/users.service.js';
import { UserInfoSchema } from '../validation/joi.validation.js';

dotenv.config();
export class UsersController {
    usersService = new UsersService();
    sendSignupMail = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {email, username, password} = validation;
            await this.usersService.sendSignupMail(email);
            return res.status(201).json({message : "이메일 전송 완료"});
        }catch(err){
            next(err);
        }
    }

    completeSignUp = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {email, username, password, Authenticationcode} = validation;

            const userInfo = await this.usersService.completeSignUp(email, username, password, Authenticationcode);

            return res.status(201).json({message : `${userInfo.username}님, 회원가입이 완료되었습니다.`, data : userInfo});
        }catch(err){
            next(err);
        }
    }

    SignIn = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {email, password} = validation;
            const {accessToken, refreshToken, findUser} = await this.usersService.SignIn(email, password);

            res.set("Authorization", `Bearer ${accessToken}`);
            res.set("Refreshtoken", `${refreshToken}`);

            return res.status(200).json({message : `${findUser.username}님 환영합니다.`, profileImage : findUser.profileImg})
        }catch(err){
            next(err);
        }
    }

    findMyInfo = async(req, res, next) => {
        try{
            const {userId} = req.user;

            const findUser = await this.usersService.findMyInfo(userId);

            return res.status(200).json({data : findUser});
        }catch(err){
            next(err);
        }
    }

    tokenReissue = async(req, res, next) => {
        try{
            const {refreshtoken} = req.headers;
            const newAccessToken = await this.usersService.tokenReissue(refreshtoken);

            res.setHeader("Authorization", `Bearer ${newAccessToken}`);
            
            return res.status(201).json({message : "AccessToken 발급 완료"});
        }catch(err){
            next(err);
        }
    }

    editMyInfo = async(req, res, next) => {
        try{
            const {userId} = req.user;
            const imageUrl = req.file.location;
            const {username} = req.body;

            await this.usersService.editMyInfo(userId, username, imageUrl);

            return res.status(201).json({message : "수정이 완료되었습니다."});
        }catch(err){
            if(err.name === "TypeError"){
                try{
                    const {refreshtoken} = req.headers;
                    const {username} = req.body;
                    const key = process.env.SECRET_KEY;
                    const userId = jwt.verify(refreshtoken, key).userId;

                    await this.usersService.editMyUsername(userId, username);

                    return res.status(201).json({message : "수정이 완료되었습니다."});
                }catch(err){
                    next(err);
                }
            }
            next(err);
        }
    }

    editPassWord = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {password} = validation;
            const {newPassword} = req.body;
            const {userId} = req.user;

            await this.usersService.updatePW(userId, password, newPassword);

            return res.status(201).json({message : "비밀번호가 변경 되었습니다."})
        }catch(err){
            next(err);
        }
    }

    signOffUser = async(req, res, next) => {
        try{
            const {userId} = req.user;

            this.usersService.SoftDeleteUser(userId);

            return res.status(201).json({message : "탈퇴처리가 완료되었습니다. 15일 동안 회원정보가 보류됩니다."});
        }catch(err){
            next(err);
        }
    }

    cancelSignOff = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {email} = validation;

            const result = await this.usersService.CancelSignOff(email);

            return res.status(201).json({message : `탈퇴 요청이 취소되었습니다.`});
        }catch(err){
            next(err);
        }
    }

    signoffInProgress = async(req, res, next) => {
        try{
            const validation = await UserInfoSchema.validateAsync(req.body);
            const {email} = validation;

            const result = await this.usersService.SignoffInProgress(email);

            return res.status(201).json({message : `탈퇴까지 ${result.days}일, ${result.hours}시간 남았습니다.`});
        }catch(err){
            next(err);
        }
    }
}