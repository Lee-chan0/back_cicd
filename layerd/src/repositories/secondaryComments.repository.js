import { prisma } from '../utils/prisma/index.js'

export class SecondaryCommentsRepository{
    findSecondaryComments = async (diaryId) => {
        const SecondaryComments = await prisma.secondaryComments.findMany({
            where : {
                DiaryId : +diaryId
            }
        })
        return SecondaryComments
    }

    findSecondaryComment = async (secondaryCommentId) => {
        const SecondaryComment = await prisma.secondaryComments.findFirst({
            where : {
                secondaryCommentId : +secondaryCommentId
            }
        })
        return SecondaryComment
    }

    updateSecondaryComment = async (secondaryCommentId, content) => {
        const updatedSecondaryComment = await prisma.secondaryComments.update({
            where : {
                secondaryCommentId : +secondaryCommentId
            }, 
            data : {
                content
            }
        })
        return updatedSecondaryComment
    }

    deleteSecondaryComment = async (secondaryCommentId, userId) => {
        await prisma.secondaryComments.delete({
            where : {
                secondaryCommentId : +secondaryCommentId,
                UserId : +userId
            }
        })
    }
}