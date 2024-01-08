import {prisma} from '../utils/prisma/index.js';

export class UsersRepository {
    findAlldeletedAtUser = async(currentDate) => {
        const findDeleteUser = await prisma.users.findMany({
            where : {
                deletedAt : {
                    lte: currentDate
                }
            }
        })
        return findDeleteUser;
    }

    deleteUserById = async(userId) => {
        const findDeleteUser = await prisma.users.delete({
            where : {
                userId : +userId
            }
        })
        return findDeleteUser;
    }

    findUserByEmail = async(email) => {
        const findByEmail = await prisma.users.findUnique({where : {email : email}})

        return findByEmail;
    }

    findUserByUserId = async(userId) => {
        const findByUserId = await prisma.users.findFirst({where : {userId : +userId}})

        return findByUserId;
    }

    createUser = async(email, encryptionPassword, username) => {
        const createdUser = await prisma.users.create({
            data : {
                username : username,
                password : encryptionPassword,
                email : email,
            }
        })
        return createdUser;
    }


    updateUserInfo = async(userId, username, imageUrl) => {
        const updateUserInfomation = await prisma.users.update({
            where : {userId : +userId},
            data : {
                username : username,
                profileImg : imageUrl,
            }
        })
        return updateUserInfomation;
    }
    updateUsername = async(userId, username) => {
        const updateUserInfomation = await prisma.users.update({
            where : {userId : +userId},
            data : {
                username : username
            }
        })
        return updateUserInfomation;
    }

    updatePassword = async(userId, encryptionPassword) => {
        const updatedPassword = await prisma.users.update({
            where : {userId : +userId},
            data : {
                password : encryptionPassword
            }
        })
        return updatedPassword;
    }

    userDeleter = async(userId, deleteDate) => {
        const deleteUserInfo = await prisma.users.update({
            where : {userId : +userId},
            data : {
                deletedAt : deleteDate
            }
        })
        return deleteUserInfo;
    }

    SignOffCancel = async(email) => {
        const cancelSignOff = await prisma.users.update({
            where : {email : email},
            data : {
                deletedAt : null
            }
        })
        return cancelSignOff;
    }
}