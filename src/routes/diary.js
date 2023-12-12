import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

const s3 = new S3Client({
  region: 'ap-northeast-2',
  credentials: fromIni(), // AWS 자격 증명 관리
});

const BUCKET_NAME = 'finaldrawings';

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
  }),
});

router.post('/diary/posting', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { EmotionStatus, content } = req.body;

    const imageUrl = req.file.location;

    const today = new Date();
    const timeZone = 'Asia/Seoul';
    const todaySeoulTime = utcToZonedTime(today, timeZone);
    const startOfToday = startOfDay(todaySeoulTime);
    const endOfToday = endOfDay(todaySeoulTime);

    const diaryExists = await prisma.diary.findFirst({
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

    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: Date.now().toString() + '-' + req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    });

    const s3Upload = await s3.send(putObjectCommand);

    const savedDiary = await prisma.diary.create({
      data: {
        UserId: userId,
        EmotionStatus,
        content,
        image: imageUrl,
      },
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
      const { EmotionalStatus, content, isPublic } = req.body;
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
            EmotionalStatus,
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
            EmotionalStatus,
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