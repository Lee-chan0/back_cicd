import { UsersRepository } from "../repositories/users.repository.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { client } from "../utils/redisClient.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export class UsersService {
  usersRepository = new UsersRepository();

  deleteExpiredUsers = async() => {
    const currentDate = new Date();

    const deletedAtUser = await this.usersRepository.findAlldeletedAtUser(currentDate);

    for(const user of deletedAtUser){
        await this.usersRepository.deleteUserById(user.userId);
    }
  }

  sendSignupMail = async (email) => {
    const existsEmail = await this.usersRepository.findUserByEmail(email);
    if (existsEmail) {
      const error = new Error("이미 가입된 이메일 입니다.");
      error.status = 403;
      throw error;
    }

    let Authenticationcode = Math.random().toString(36).substring(2, 8);

    await client.setex(email, 180, Authenticationcode);

    const mailer = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
      },
    });
    const htmlContent = `
        <div style="font-family: 'Arial', sans-serif; max-width: 400px; margin: 20px auto; background-color: #fdfdfd; padding: 20px; border-radius: 15px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); border: 3px solid papayawhip; color: #000; text-align: center;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #000; font-weight: normal;">NINE Cloud에 오신 것을 환영합니다.</h2>
        <p style="font-size: 14px; margin-bottom: 15px;">이메일 인증을 위한 코드가 도착했습니다.</p>
        <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;"> 인증코드: ${Authenticationcode} </p>
        <div style="font-size: 12px; color: #000;">- NINE Cloud를 즐겨보세요 -</div>
        </div>
    `;

    const mailOptions = {
      from: process.env.MAILER_EMAIL,
      to: email,
      subject: "[NINE Cloud에서 보낸 인증코드]",
      html: htmlContent,
      text: `인증코드 : ${Authenticationcode}를 입력해주세요.`,
    };

    mailer.sendMail(mailOptions, (error, info) => {
      if (error) {
        const error = new Error("메일 전송도중 Error가 발생했습니다.");
        error.status = 406;
        throw error;
      } else {
        console.log(`이메일 전송 정보 : ${info.response}`);
      }
    });
  };

  completeSignUp = async (email, username, password, Authenticationcode) => {
    const serverAuthenticationCode = await client.get(email);

    if(!serverAuthenticationCode){
        const error = new Error('인증코드가 만료되었습니다.');
        error.status = 401;
        throw error;
    }

    if(Authenticationcode === serverAuthenticationCode){
        const encryptionPassword = await bcrypt.hash(password, 10);

        await this.usersRepository.createUser(email, encryptionPassword, username);

        const userInfo = await this.usersRepository.findUserByEmail(email);

        return {
            userId : userInfo.userId,
            username : userInfo.username,
            email : userInfo.email,
            profileImg : userInfo.profileImg,
            userType : userInfo.userType,
        }
    }else {
        const error = new Error('인증코드가 올바르지 않습니다.');
        error.status = 400;
        throw error;
    }
  };

  SignIn = async(email, password) => {
    const key = process.env.SECRET_KEY;

    const findUser = await this.usersRepository.findUserByEmail(email);
    if(!findUser){
        const error = new Error('존재하지 않는 email입니다.');
        error.status = 400;
        throw error;
    }
    const decodedPassword = await bcrypt.compare(password, findUser.password);

    if(!decodedPassword){
        const error = new Error('비밀번호가 일치하지 않습니다.');
        error.status = 400;
        throw error;
    }

    const accessToken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "1h"});
    const refreshToken = jwt.sign({userId : findUser.userId}, key, {expiresIn : "7d"});

    await client.set(`RefreshToken:${findUser.userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    return {
        findUser, accessToken, refreshToken
    }
  }

  findMyInfo = async(userId) => {
    const user = await this.usersRepository.findUserByUserId(userId);

    if(!user){
        const error = new Error('존재하지 않는 유저입니다.');
        error.status = 400;
        throw error;
    }

    return {
        userId : user.userId,
        username : user.username,
        email : user.email,
        profileImg : user.profileImg,
        userType : user.userType,
    }
  }

  tokenReissue = async(refreshtoken) => {
    const key = process.env.SECRET_KEY;
    const userInfo = jwt.verify(refreshtoken, key);
    const userId = userInfo.userId;

    const storedRefreshToken = await client.get(`RefreshToken:${userId}`);
    if(refreshtoken !== storedRefreshToken){
        await client.del(`RefreshToken:${userId}`);
        const error = new Error('비정상적인 접근입니다. 다시 로그인 하세요');
        error.status = 401;
        throw error;
    }else {
        const newAccessToken = jwt.sign({userId : +userId}, key, {expiresIn : "1h"});
        return newAccessToken
    }
  }

  editMyInfo = async(userId, username, imageUrl) => {
    await this.usersRepository.updateUserInfo(userId, username, imageUrl);
  }
  editMyUsername = async(userId, username) => {
    await this.usersRepository.updateUsername(userId, username);
  }

  updatePW = async(userId, password, newPassword) => {
    const findUser = await this.usersRepository.findUserByUserId(userId);
    if(findUser.userType !== 'Common'){
        const error = new Error('소셜로그인 사용자는 비밀번호를 변경할 수 없습니다.');
        error.status = 400;
        throw error;
    }
    const decodedPW = await bcrypt.compare(password, findUser.password);

    if(!decodedPW) {
        const error = new Error('비밀번호가 틀립니다.')
        error.status = 400;
        throw error;
    }

    const encryptionPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.updatePassword(userId, encryptionPassword);
  }

  SoftDeleteUser = async(userId) => {
    const currentDate = new Date();
    const deleteDate = new Date(currentDate);

    deleteDate.setDate(deleteDate.getDate() + 15);

    deleteDate.setUTCHours(deleteDate.getUTCHours() + 9);

    await this.usersRepository.userDeleter(userId, deleteDate);
  }

  CancelSignOff = async(email) => {
    const currentDate = new Date();
    const deleteDate = new Date(currentDate);

    deleteDate.setUTCHours(deleteDate.getUTCHours() + 9);

    const findUser = await this.usersRepository.findUserByEmail(email);
    if(!findUser){
        const error = new Error('사용자가 없습니다.');
        error.status = 400;
        throw error;
    }

    const subTime = findUser.deletedAt - deleteDate;

    const Day = 24 * 60 * 60 * 1000;
    const Hour = 60 * 60 * 1000;

    const days = Math.floor(subTime / Day);
    const hours = Math.floor((subTime % Day) / Hour);

    const Cancel_Signoff = await this.usersRepository.SignOffCancel(email);

    return {
        Cancel_Signoff,
        days,
        hours,
    }
  }
}
