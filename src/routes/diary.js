import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { upload } from '../middleware/S3.upload/multer.js'



const router = express.Router();

/**
 * @swagger
 * tags:
 *    - name: diaries
 *
 * /diaries/detail/{diaryId}:
 *   get:
 *     tags:
 *       - diaries
 *     summary: 일기 조회
 *     parameters:
 *       - in: path
 *         name: diaryId
 *         description: 표시하고자 하는 다이어리의 Id값
 *         required: true
 *         type: string
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *        200:
 *          description: 일기 조회 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        400: 
 *          description: 일기 조회 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 * 
 *
 * /diaries/posting:
 *   post:
 *     tags:
 *       - diaries
 *     summary: 일기 등록
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               EmotionStatus:
 *                 type: integer
 *                 description: 감정상태값
 *               content:
 *                 type: string
 *                 description: 일기 내용
 *               isPublic:
 *                 type: boolean
 *                 description: 공개 설정
 *               weather:
 *                 type: string
 *                 description: 날씨 값
 *               sentence:
 *                 type: string
 *                 description: 포춘쿠키 한마디
 *     responses:
 *        200:
 *          description: 일기 등록 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        400: 
 *          description: 일기 등록 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 * 
 *     security:
 *        - BearerAuth: []
 * 
 * /diaries/edit/{diaryId}:
 *   patch:
 *     tags:
 *       - diaries
 *     summary: 일기 수정
 *     parameters:
 *       - in: body
 *         name: content, isPublic
 *         description: 수정할 내용
 *         required: true
 *         type: string
 *       - in: path
 *         name: diaryId
 *         description: 수정하고자 하는 다이어리의 Id값
 *         required: true
 *         type: string
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *        201:
 *          description: 일기 수정 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        300:
 *          description: 입력한 diaryId값에 할당된 일기 데이터가 존재하지 않음
 *          constent:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                  type: string
 *        400: 
 *          description: 일기 수정 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 * 
 * /diaries/delete/{diaryId}:
 *   delete:
 *     tags:
 *       - diaries
 *     summary: 일기 삭제
 *     parameters:
 *       - in: path
 *         name: diaryId
 *         description: 삭제하고자 하는 다이어리의 Id값
 *         required: true
 *         type: string
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Bearer 토큰
 *       - in: header
 *         name: Refreshtoken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh 토큰
 *     responses:
 *        201:
 *          description: 일기 삭제 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  data:
 *                    type: array
 *        401:
 *          description: 입력한 diaryId값에 할당된 일기 데이터가 존재하지 않음
 *          constent:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                  type: string
 *        400: 
 *          description: 일기 삭제 실패 및 서버 에러
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 */



let lastViewTime = {};

setInterval(() => {
  const currentTime = new Date().getTime();
  for (const userId in lastViewTime) {
    if (currentTime - lastViewTime[userId] >= 600000) {
      delete lastViewTime[userId];
    }
  }
}, 600000);

/* 일기 상세 조회 */
router.get('/diary/detail/:diaryId', authMiddleware, async (req, res, next) => {
  try {
      const { diaryId } = req.params;
      const { userId } = req.user

      const diaryDetail = await prisma.diaries.findFirst({
          where: { 
            diaryId: +diaryId,  
            OR : [
              {UserId : userId},
              {isPublic : true}
            ]
            
          }
      });

      if (!diaryDetail) {
        return res.status(400).json({ message : "존재하지 않는 일기입니다."})
      }

      if (userId in lastViewTime) {
        const lastTime = lastViewTime[userId]
        const currentTime = new Date().getTime()

        if (currentTime - lastTime < 600000) {
          return res.status(200).json({ data: diaryDetail})
        }
      }
      /* 조회수 기능 추가 */
      if (diaryDetail.UserId !== +userId) {

        lastViewTime[userId] = new Date().getTime()

        const updatedDiary = await prisma.diaries.update({
          where: { diaryId: +diaryId },
          data: { viewCount : diaryDetail.viewCount + 1 }
        })
        return res.status(200).json({ data: updatedDiary})
      } else {
        return res.status(200).json({ data: diaryDetail})
      }
  } catch (error) {
      return res.status(400).json({ error: error.message });
  }
});

/* 일기 등록 */
router.post('/diary/posting', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { EmotionStatus, content, isPublic, weather, sentence } = req.body;

    const  imageUrl = req.file.location

    const today = new Date();
    const timeZone = 'Asia/Seoul';
    const todaySeoulTime = utcToZonedTime(today, timeZone);
    const startOfToday = startOfDay(todaySeoulTime);
    const endOfToday = endOfDay(todaySeoulTime);

    const diaryExists = await prisma.diaries.findFirst({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        UserId: userId,
      },
    });

    if (diaryExists) {
      return res.status(300).json({ message: '오늘은 이미 작성한 글이 있습니다. 수정하시겠습니까?' });
    }

    const savedDiary = await prisma.diaries.create({
      data: {
        EmotionStatus : +EmotionStatus,
        content,
        image: imageUrl,
        isPublic: Boolean(isPublic),
        weather,
        sentence,
        User: {
          connect : {userId}
      },  
      }
    });

    return res.status(201).json({ message: '다이어리 등록 완료', data: savedDiary });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
 
/* 일기수정 */
router.patch('/diary/edit/:diaryId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { diaryId } = req.params
    const { content, isPublic } = req.body;

    const diaryExists = await prisma.diaries.findFirst({
      where: {
        diaryId : +diaryId,
        UserId: userId,
      },
    });

    if (!diaryExists) {
      return res.status(300).json({ message: '작성된 일기가 없습니다' });
    }

    const savedDiary = await prisma.diaries.update({
      where : {
        diaryId : +diaryId
      },
      data: {
        content,
        isPublic: Boolean(isPublic),
      }
    });

    return res.status(201).json({ message: '다이어리 수정 완료', data: savedDiary });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
  
/* 일기 삭제 */
router.delete('/diary/delete/:diaryId', authMiddleware, async (req, res, next) => {
try{
  const {diaryId} = req.params

  const diary = await prisma.diaries.findFirst({
    where: {diaryId : +diaryId}
  })

  if (!diary) {
    return res.status(401).json({ message : "삭제하려는 일기가 존재하지 않습니다"})
  }

  await prisma.diaries.delete({
    where: {diaryId : +diaryId}
  })

  return res.status(201).json({ message : "삭제 완료"})
}catch(error) {
  return res.status(400).json({ error: error.message })
}
})
  

export default router;