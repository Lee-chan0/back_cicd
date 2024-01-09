import { DiaryService } from '../services/diary.service.js'
import { DiarySchema } from '../validation/joi.validation.js'
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

/* 조회수 로직을 위한 시간계산 로직 */
let lastViewTime = {};

setInterval(() => {
  const currentTime = new Date().getTime();
  for (const userId in lastViewTime) {
    if (currentTime - lastViewTime[userId] >= 600000) {
      delete lastViewTime[userId];
    }
  }
}, 600000);
/* 조회수 시간로직 끝 */

export class DiaryController {
    diaryService = new DiaryService()

    getDiary = async (req, res, next) => {
        try{

            const { diaryId } = await DiarySchema.validateAsync(req.params);
            const { userId } = req.user

            const diary = this.diaryService.findDiary(diaryId, userId)

            const isliked = this.diaryService.findliked(diaryId, userId)

            if (!diary) {
                return res.status(400).json({ message : "존재하지 않는 일기입니다"})
            }

            if (userId in lastViewTime) {
                const lastTime = lastViewTime[userId]
                const currentTime = new Date().getTime()
        
                if (currentTime - lastTime < 600000) {
                  return res.status(200).json({ data: diaryDetail, like: isliked})
                }
              }
              /* 조회수 기능 */
              if (diary.UserId !== +userId) {
        
                lastViewTime[userId] = new Date().getTime()
        
                const updatedDiary = await this.diaryService.updateViewCount(diaryId) // repository 에서 data : { viewCount : 해당diary.viewCount + 1} 로직추가필요

                return res.status(200).json({ data: updatedDiary, like: isliked})
              } else {
                return res.status(200).json({ data: diary, like: isliked})
              }

        } catch(err) {
            next(err)
        }
    }

    postDiary = async (req, res, next) => {
        try {
            const { userId } = req.user;
            const { EmotionStatus, content, isPublic, weather, sentence, temperature, humid, sleep } = await DiarySchema.validateAsync(req.body);
            const imageUrl = req.file.location

            const today = new Date();
            const timeZone = 'Asia/Seoul';
            const todaySeoulTime = utcToZonedTime(today, timeZone);
            const startOfToday = startOfDay(todaySeoulTime);
            const endOfToday = endOfDay(todaySeoulTime);

            const diaryExists = await this.diaryService.findTodayDiary(startOfToday, endOfToday, userId)

            if (diaryExists) {
                return res.status(300).json({ message : '오늘은 이미 작성한 글이 있습니다.  수정하시겠습니까?'})
            }

            const savedDiary = await this.diaryService.postDiary(
                EmotionStatus, 
                content, 
                isPublic, 
                weather, 
                sentence, 
                temperature, 
                humid, 
                sleep,
                imageUrl,
                todaySeoulTime,
                userId
                )
                
                return res.status(201).json({ message: '다이어리 등록 완료', data: savedDiary });
        } catch(err) {
            next(err)
        }
    }

    updateDiary = async (req, res, next) => {
        try{
            const { userId } = req.user;
            const { diaryId } = await DiarySchema.validateAsync(req.params);
            const { content, isPublic } = await DiarySchema.validateAsync(req.body);

            const diaryExists = await this.diaryService.findMyDiary(
                diaryId,
                userId
                )

            if (!diaryExists) {
                return res.status(300).json({ message: '작성된 일기가 없습니다'})
            }

            const updatedDiary = await this.diaryService.updateDiary(
                diaryId, 
                content, 
                isPublic
                )

                return res.status(201).json({ message: '다이어리 수정 완료', data : updatedDiary})
        }catch(err) {
            next(err)
        }
    }

    deleteDiary = async (req, res, next) => {
        try{
            const { diaryId } = await DiarySchema.validateAsync(req.params);
            const { userId } = req.user

            const diary = await this.diaryService.findMyDiary(diaryId, userId)

            if (!diary) {
                return res.status(401).json({ message: "삭제하려는 일기가 존재하지 않습니다"})
            }

            await this.diaryService.deleteDiary(diaryId, userId)
            
            return res.status(201).json({ message: "삭제 완료"})
        } catch(err) {
            next(err)
        }
    }
}