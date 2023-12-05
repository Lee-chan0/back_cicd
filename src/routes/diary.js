import express from 'express'
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns'

const router = express.Router()

/* 작성한 글 상세조회(캘린더 클릭 포함) */

router.get('/diary/detail/:diaryId', async(req, res, next) => {
    try{
    const { diaryId } = req.params // 기존의 전체조회에서 보내준 data를 기준으로 프론트에서 diaryId값을 params로 보내주면 조회 

    const diaryDetail = await prisma.diary.findFirst({ 
        where : { diaryId : +diaryId}
    })
    return res.status(200).json({data: diaryDetail})
    } catch(error) {
        return res.status(400).json({ error : error.message })
    }
})

/* 피드에 글 조회 */
router.get('/diary', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user // 피드에서 직접 좋아요 등을 시도할 때 사용예정. 혹은 친구기능이 들어갈경우, 친구의 private 게시물등을 볼 수 있는 권한? 추가 가능성
        const page = parseInt(req.query.page) || 1; // *변경가능* http://example.com/diary/calendar?page=2 식의 쿼리 파라미터로 요청전달이 들어올경우 이렇게 처리할 예정. 변경시 코드변경
        const pageSize = 10; // 한 페이지에 표시할 아이템 수
        const skip = (page - 1) * pageSize; // 건너뛸 아이템 수


        const today = new Date();
        const twoMonthsAgo = subMonths(today, 2);

        const diaryEntries = await prisma.diary.findMany({
            where: { 
                createdAt : {
                    gte: twoMonthsAgo,
                    lte: today
                }
             }, // 2개월 이내의 피드만 가져오도록
            skip: skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(diaryEntries);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/* 오늘의 일기 작성 */
router.post('/diary/posting', authMiddleware, async(req, res, next) => {
    try{
    const { userId } = req.user
    const { ImotionStatus, content, image } = req.body
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)


    const diaryExists = await prisma.diary.findFirst({
        where : { createdAt: {
            gte : startOfToday,
            lte : endOfToday
        }
        }
    })

    if (diaryExists) {
        return res.status(400).json({ message : "오늘은 이미 작성한 글이 있습니다"})
    }

    const diary = await prisma.diary.create({
        data : {
            UserId : userId,
            ImotionStatus,
            content,
            image,
        }
    })
    return res.status(201).json({ message: "다이어리 등록 완료", data : diary})
}catch(error) {
    return res.status(400).json({ error: error.message})
}
})

export default router