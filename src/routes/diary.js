import express from 'express'
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';
import multer from 'multer'
import multerS3 from 'multer-s3'
import AWS from 'aws-sdk'
import dotenv from "dotenv"

const router = express.Router();
dotenv.config();

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
const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2',
  });

const BUCKET_NAME = 'finaldrawings'

const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read', // 접근 권한 설정 (public-read로 설정하면 URL로 접근 가능)
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + '-' + file.originalname); // 파일 이름 설정
      },
    }),
  });
  
  router.post('/diary/posting', authMiddleware, upload.single('image'), async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { EmotionStatus, content, image } = req.body;
      const imageBuffer = req.file.buffer;
  
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
  
      const params = {
        Bucket: BUCKET_NAME,
        Key: Date.now().toString() + '-' + req.file.originalname,
        Body: imageBuffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      };
  
      const s3Upload = await s3.upload(params).promise();
  
      const savedImage = await prisma.Images.create({
        data: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          // S3에 저장된 이미지의 URL을 사용하도록 수정
          data: s3Upload.Location,
        },
      });
  
      const diary = await prisma.diaries.create({
        data: {
          UserId: userId,
          EmotionStatus,
          content,
          image: {
            connect: {
              imageId: savedImage.imageId,
            },
          },
        },
      });
  
      return res.status(201).json({ message: '다이어리 등록 완료', data: diary });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

/* 일기수정 */
router.patch('/diary/edit/:diaryId', authMiddleware, async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { EmotionStatus, content, isPublic, image } = req.body;
      const { diaryId } = req.params;
  
      const diary = await prisma.diaries.findFirst({
        where: { diaryId: +diaryId }
      });
  
      if (!diary) {
        return res.status(400).json({ message: "수정하려는 일기가 존재하지 않습니다" });
      }
  
      if (diary.UserId !== userId) {
        return res.status(401).json({ message: "수정 권한이 없는 게시물입니다" });
      }
  
      // 이미지가 수정되는 경우에만 처리
      if (req.file) {
        const savedImage = await prisma.Images.create({
          data: {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            data: `https://${req.file.bucket}.s3.amazonaws.com/${req.file.key}`,
          },
        });
  
        await prisma.diaries.update({
          where: { diaryId: +diaryId },
          data: {
            content,
            EmotionStatus,
            isPublic,
            image: {
              connect: {
                imageId: savedImage.imageId,
              },
            },
          },
        });
      } else {
        // 이미지가 수정되지 않은 경우에는 이미지 필드를 업데이트하지 않음
        await prisma.diaries.update({
          where: { diaryId: +diaryId },
          data: {
            content,
            EmotionStatus,
            isPublic,
          },
        });
      }
  
      return res.status(201).json({ message: "수정완료" });
  
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });
  
  

export default router;