import express from 'express'
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import { startOfMonth, endOfMonth, getDate } from 'date-fns'

const router = express.Router()


/* 메인페이지 조회 ( 캘린더, 회원정보(회원프로필 이미지) ) */

/* 기본 페이지 조회일 뿐, 좌우 버튼으로 몇월달을 선택하느냐에 따라 startDate, endDate 값이 변화할 수 있어야 함
    왼쪽 버튼을 누르면 startOfMonth(currentdate) - 1, 오른쪽을 누르면 + 1 이 되는 로직 필요. 프론트와 상의 */
router.get('/diary/calendar', authMiddleware, async (req, res, next) => {
    try{
        const { userId } = req.user
        const currentDate = new Date()
        const startDate = startOfMonth(currentDate)
        const endDate = endOfMonth(currentDate)

        const diaries = await prisma.diary.findMany({
            where : { UserId : userId, 
                createdAt : {
                    gte : startDate,
                    lte : endDate
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // 각 월에 맞는 빈 배열을 생성하고
        // date을 1부터 차례대로 조회하여 값이 없으면 null을 push, 있다면 obj자체를 push
        // 반환된 배열을 data로 res에 담아 보낸다

        const modifiedDiaries = diaries.map(diary => {
            const year = diary.createdAt.getFullYear()
            const month = diary.createdAt.getMonth() + 1
            const date = diary.createdAt.getDate()

            diary.createdAt = `${year}. ${month}. ${date}.` ;
            return diary
        })

        const userProfileImg = await prisma.users.findFirst({
            where : { userId },
            select : { 
                userId: true,
                profileImg: true
            }
        })

        const arrayedDiaries = new Array(getDate(endDate)).fill(null)

        modifiedDiaries.map(diary => {
            let index = diary.createdAt.split(".")[2].trim()
            arrayedDiaries[index-1] = diary
            return arrayedDiaries
        })
        

        res.status(200).json({ data: arrayedDiaries, userProfileImg })
    } catch(error) {
        return res.status(400).json({ error: error.message})
    }
})

export default router;