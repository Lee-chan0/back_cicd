import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { startOfDay, endOfDay, subMonths } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

const router = express.Router();


/* 피드 글 조회 */
router.get('/feeds', authMiddleware, async (req, res, next) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 10;

      // 이전 페이지에서 마지막 데이터의 createdAt 값 가져오기 (데이터의 마지막 index값에 해당하는 value의 createdAt 값을 전달받는다)
      const lastCreatedAt = req.query.lastCreatedAt; // 클라이언트에서 전달된 마지막 데이터의 createdAt 값

      const today = new Date();
      const timeZone = 'Asia/Seoul';
      const twoMonthsAgo = utcToZonedTime(startOfDay(subMonths(today, 2)), timeZone);
      const todaySeoulTime = utcToZonedTime(endOfDay(today), timeZone);

      const diaryEntries = await prisma.diaries.findMany({
          where: {
              createdAt: {
                  gte: twoMonthsAgo,
                  lte: todaySeoulTime,
                  // lastCreatedAt 값보다 큰 데이터만 가져오기 (중복 제거)
                  gt: lastCreatedAt ? new Date(lastCreatedAt) : undefined,
              }
          },
          take: pageSize,
          skip: page > 1 ? (page - 1) * pageSize : 0,
          orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({ data: diaryEntries });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
});


/* 피드에 좋아요 기능 */




// /* 피드 조회 => 피드만 조회할 뿐 이에 연결된 댓글은 조회되지 않는다. (갯수만 조회하고 클릭하면 댓글을 조회하는 형식) */
// router.get('/feeds', async (req, res, next) => {
//     try {
//         const page = req.query.page ? parseInt(req.query.page) : 1;
//         const perPage = 10;
//         const feeds = await prisma.diaries.findMany({
//           where: { isPublic: true },
//           orderBy: { createdAt: 'desc' },
//           skip: (page - 1) * perPage,
//           take: perPage,
//         });
//         res.json(feeds);
//       } catch (err) {
//         res.status(400).json({ message: err.message });
//       }
// })
// // 피드를 새롭게 조회중에 db에 새로운 diary가 추가 될 경우 새롭게 호출하는 db의 순번이 바뀌어 중복된 feed가 출력될 수 있다
// // 이를 해결할 방법을 고민해봐야함. 일단은 프론트와 논의되기 전까지의 뼈대코드


export default router;