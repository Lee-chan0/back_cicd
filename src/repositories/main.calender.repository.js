import { prisma } from '../utils/prisma/index.js'

export class CalendarRepository {
    getCalendar = async (userId, startDate, endDate) => {
        const diaries = await prisma.diaries.findMany({
            where: {
                UserId: userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                createdAt: "asc"
            }
        })
        return diaries
    }

    getProfileImg = async (userId) => {
        const profileImg = await prisma.users.findFirst({
            where: { userId },
            select: {
                userId: true,
                profileImg: true,
            }
        })

        if (profileImg.profileImg = null) {
            return null
        } else {
            return profileImg
        }
    }
}