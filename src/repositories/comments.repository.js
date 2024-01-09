import { prisma } from '../utils/prisma/index.js'

export class CommentsRepository{
    createComment = async (diaryId, UserId, content) => {
        const comment = await prisma.comments.create({
            data: {
                DiaryId: +diaryId,
                UserId: UserId,
                content,
            }
        })
        return comment
    }

    findComments = async (diaryId) => {
        const comments = await prisma.comments.findMany({
            where : {
                DiaryId : +diaryId
            },
            include: {
                User: {
                    select: {
                        username: true,
                        profileImg: true,
                    }
                }
            }
        })
        return comments
    }

    findComment = async (commentId, userId) => {
        const comment = await prisma.comments.findFirst({
            where : {
                commentId : +commentId,
                UserId : userId
            }
        })
        return comment
    }

    updateComment = async (commentId, content) => {
        const updatedComment = await prisma.comments.update({
            where : {
                commentId : +commentId,
            }, 
            data : {
                content : content,
                isEdited : true
            }
        })
        return updatedComment
    }

    deleteComment = async (commentId, userId) => {
        await prisma.comments.delete({
            where : {
                commentId : +commentId,
                UserId : userId
            }
        })
    }
}