import { prisma } from '../utils/prisma/index.js'

export class DiaryRepository{
    findDiary = async (diaryId, userId) => {
        const diary = await prisma.diaries.findFirst({
            where : {
                diaryId : +diaryId,
                OR : [
                    {UserId: userId},
                    {isPublic : true}
                ]
            }
        })
        return diary
    }

    findMyDiary = async (diaryId, userId) => {
        const diary = await prisma.diaries.findFirst({
            where : {
                diaryId : +diaryId,
                UserId : userId
            }
        })
        return diary
    }

    updateViewCount = async (diaryId) => {
        const diary = await prisma.diaries.findFirst({
            where : {
                diaryId : +diaryId
            }
        })

        const ViewUpdatedDiary = await prisma.diaries.update({
            where : {
                diaryId : +diaryId
            }, 
            data : {
                viewCount : diary.viewCount + 1
            }
        })
        return ViewUpdatedDiary
    }

    findTodayDiary = async (startOfToday, endOfTOday, userId) => {
        const TodayDiary = await prisma.diaries.findFirst({
            where : {
                createdAt: {
                    gte: startOfToday,
                    lte: endOfTOday
                },
                UserId : userId
            }
        })
        return TodayDiary
    }

    postDiary = async ( EmotionStatus, content, isPublic, weather, sentence, temperature, humid, sleep, imageUrl, todaySeoulTime, userId ) => {
        const diary = await prisma.diaries.create({
            data: {
                EmotionStatus : +EmotionStatus,
                content,
                image: imageUrl,
                isPublic: Boolean(isPublic),
                weather,
                sentence,
                createdAt: todaySeoulTime,
                temperature,
                humid,
                sleep,
                User: {
                  connect : {userId},
                }
            }
        })
        return diary
    }
}

    updateDiary = async ( diaryId, content, isPublic) => {
        const updatedDiary = await prisma.diaries.update({
            where : {
                diaryId : +diaryId
            },
            data : {
                content,
                isPublic: Boolean(isPublic)
            }
        })
        return updatedDiary
    }

    deleteDiary = async (diaryId) => {
        const deletedDiary = await prisma.diaries.delete({
            where : {
                diaryId : +diaryId
            }
        })
        return deletedDiary
    }