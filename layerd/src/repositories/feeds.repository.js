import { prisma } from '../utils/prisma/index.js'

export class FeedsRepository {
    getFeeds = async (twoMonthsAgo, todaySeoulTime, lastCreatedAt, pageSize, page) => {
        const feeds = await prisma.diaries.findMany({
            where : {
                isPublic : true,
                createdAt: {
                    gte: twoMonthsAgo,
                    lte: todaySeoulTime,
                    lt: lastCreatedAt ? new Date(lastCreatedAt) : undefined,
                },
                take: pageSize, 
                skip: page > 1 ? (page - 1) * pageSize : 0,
                orderBy: { createdAt: 'desc' }
            }
        })
        return feeds
    }

    getMyFeedsNoDateGiven = async (userId, today, lastCreatedAt, pageSize, page) => {

        const myFeedsNoDateGiven = await prisma.diaries.findMany({
            where: {
                UserId : userId,
                createdAt: {
                    lte: today,
                    lt: lastCreatedAt ? new Date(lastCreatedAt) : undefined,
                }
            },
            take: pageSize,
            skip: page > 1 ? (page - 1) * pageSize : 0,
            orderBy: { createdAt: 'desc' }
        });
        return myFeedsNoDateGiven
    }

    getMyFeeds = async (userId, firstday, lastday, pageSize, page) => {
        const myFeeds = await prisma.diaries.findMany({
            where: {
                UserId : userId,
                createdAt: {
                    gte : firstday,
                    lte: lastday,
                }
            },
            take: pageSize,
            skip: page > 1 ? (page - 1) * pageSize : 0,
            orderBy: { createdAt: 'desc' }
        });
        return myFeeds
    }

    existsLike = async (diaryId, userId) => {
        const existsLike = await prisma.diaryLikes.findFirst({
            where: { DiaryId: +diaryId, UserId: +userId },
          });
          return existsLike
    }

    existsDiary = async (diaryId) => {
        const existsDiary = await prisma.diaries.findFirst({
            where: { diaryId: +diaryId },
          });
    }

    existsLikeDiaryLikeId = async (diaryId, userId) => {
        const existsLike = await prisma.diaryLikes.findFirst({
            where :{
                DiaryId : +diaryId,
                UserId : +userId
            }
        })
        return existsLike.diarylikeId
    }

    deleteLike = async (diarylikeId, diaryId, userId) => {
        await prisma.diaryLikes.delete({
            where: {
              diarylikeId: existsLike.diarylikeId,
              DiaryId: +diaryId,
              UserId: +userId,
            },
          });
    }

    decreaseLikeCount = async (diaryId) => {
        const islike = await prisma.diaries.update({
            where: { diaryId: +diaryId },
            data: {
              likeCount: {
                decrement: 1,
              },
            },
          });
          return islike
    }

    increasLikeCount = async (diaryId) => {
        const likeClick = await prisma.diaries.update({
            where: { diaryId: +diaryId },
            data: {
              likeCount: {
                increment: 1,
              },
            },
          });
          return likeClick
    }
}









///////////////////////////////

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