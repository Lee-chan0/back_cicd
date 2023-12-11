// import express from 'express'
// import { prisma } from '../utils/prisma/index.js';
// import authMiddleware from '../middlewares/auth.middleware.js';
// import { startOfDay, endOfDay } from 'date-fns';
// import { utcToZonedTime, format } from 'date-fns-tz';
// import multer from 'multer'
// import multerS3 from 'multer-s3'
// import AWS from 'aws-sdk'
// import dotenv from "dotenv"

// const app = express();
// dotenv.config();

// const s3 = new AWS.S3({
//     // process.env.S3_ACCESS_KEY
//     // process.env.S3_SECRET_ACCESS_KEY
//     accessKeyId: process.env.S3_ACCESS_KEY,
//     secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//     region: 'ap-northeast-2',
//   });

// const BUCKET_NAME = 'finaldrawings'

// const upload = multer({
//     storage: multerS3({
//       s3: s3,
//       bucket: BUCKET_NAME,
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       acl: 'public-read', // 접근 권한 설정 (public-read로 설정하면 URL로 접근 가능)
//       key: function (req, file, cb) {
//         cb(null, Date.now().toString() + '-' + file.originalname); // 파일 이름 설정
//       },
//     }),
//   });

// app.post('/diary/posting', authMiddleware, upload.single('picture'), async (req, res, next) => {
//     try {
//       const { userId } = req.user;
//       const { EmotionStatus, content } = req.body;
//       const imageBuffer = req.file.buffer;
  
//       const today = new Date();
//       const timeZone = 'Asia/Seoul';
//       const todaySeoulTime = utcToZonedTime(today, timeZone);
//       const startOfToday = startOfDay(todaySeoulTime);
//       const endOfToday = endOfDay(todaySeoulTime);
  
//       const diaryExists = await prisma.diaries.findFirst({
//         where: {
//           createdAt: {
//             gte: startOfToday,
//             lte: endOfToday,
//           },
//           UserId: userId,
//         },
//       });
  
//       if (diaryExists) {
//         return res.status(300).json({ message: '오늘은 이미 작성한 글이 있습니다. 수정하시겠습니까?' });
//       }
  
//       const savedImage = await prisma.Images.create({
//         data: {
//           filename: req.file.originalname,
//           mimetype: req.file.mimetype,
//           // S3에 저장된 이미지의 URL을 사용하도록 수정
//           data: `https://${BUCKET_NAME}.s3.amazonaws.com/${req.file.key}`,
//         },
//       });
  
//       const diary = await prisma.diaries.create({
//         data: {
//           UserId: userId,
//           EmotionStatus,
//           content,
//           image: {
//             connect: {
//               imageId: savedImage.imageId,
//             },
//           },
//         },
//       });
  
//       return res.status(201).json({ message: '다이어리 등록 완료', data: diary });
//     } catch (error) {
//       return res.status(400).json({ error: error.message });
//     }
// });
