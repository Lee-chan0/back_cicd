import {prisma} from '../utils/prisma/index.js';

export class OauthRepository {
    findUserByEmail = async(email) => {
        const findUserbyEmail = await prisma.users.findFirst({ where : {email : email} });
        return findUserbyEmail;
    }

    createdUser = async(email, nickname, encryptionPassword, profileImg, userType) => {
        const createUser = await prisma.users.create({
            data : {
                email : email,
                username : nickname,
                password : encryptionPassword,
                profileImg : profileImg,
                userType : userType,
            }
        })
        return createUser;
    }
}