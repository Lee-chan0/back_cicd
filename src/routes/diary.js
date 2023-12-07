import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';

const router = express.Router();

/* 작성한 글 상세조회(캘린더 클릭 포함) */
router.get('/diary/detail/:diaryId', async (req, res, next) => {
    try {
        const { diaryId } = req.params;

        const diaryDetail = await prisma.diaries.findFirst({
            where: { diaryId: +diaryId }
        });
        return res.status(200).json({ data: diaryDetail });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});


/* 오늘의 일기 작성 */
router.post('/diary/posting', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { EmotionStatus, content, image } = req.body;
        const today = new Date();
        const timeZone = 'Asia/Seoul';
        const todaySeoulTime = utcToZonedTime(today, timeZone);
        const startOfToday = startOfDay(todaySeoulTime);
        const endOfToday = endOfDay(todaySeoulTime);

        const diaryExists = await prisma.diaries.findFirst({
            where: {
                createdAt: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                UserId: userId
            }
        });

        if (diaryExists) {
            return res.status(300).json({ message: "오늘은 이미 작성한 글이 있습니다. 수정하시겠습니까?" });
        }

        const diary = await prisma.diaries.create({
            data: {
                UserId: userId,
                EmotionStatus,
                content,
                image,
            }
        });
        return res.status(201).json({ message: "다이어리 등록 완료", data: diary });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

/* 일기 수정 */
router.patch('/diary/edit/:diaryId', authMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { EmotionStatus, content, image } = req.body;
        const { diaryId } = req.params;

        const diary = await prisma.diaries.findFirst({
            where: { diaryId: +diaryId }
        });

        if (diary.UserId !== userId) {
            return res.status(401).json({ message: "수정 권한이 없는 게시물입니다" });
        }

        if (!diary) {
            return res.status(400).json({ message: "수정하려는 일기가 존재하지 않습니다" });
        }

        await prisma.diaries.update({
            where: { diaryId: +diaryId },
            data: { content, image, EmotionStatus }
        });
        return res.status(201).json({ message: "수정완료" });

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

export default router;
