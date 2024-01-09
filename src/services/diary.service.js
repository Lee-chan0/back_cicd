import { DiaryRepository } from '../repositories/diary.repository.js'

export class DiaryService {
    diaryRepository = new DiaryRepository();

    findDiary = async (diaryId ,userId) => {
        const diary = await this.diaryRepository.findDiary(
            diaryId, 
            userId
        )
        return diary
    }

    findliked = async (diaryId, userId) => {
        const isliked = await this.diaryRepository.findliked(
            diaryId,
            userId
        )
        return isliked
    }


    findMyDiary = async (diaryId, userId) => {
        const diary = await this.diaryRepository.findMyDiary(
            diaryId,
            userId
        )
        return diary
    }

    updateViewCount = async (diaryId) => { //viewcount : 해당diary.viewCount + 1 로직 repo에서추가
        const diary = await this.diaryRepository.updateViewCount(
            diaryId,
        )
        return diary
    }

    findTodayDiary = async (startOfToday, endOfToday, userId) => {
        const diary = await this.diaryRepository.findTodayDiary(
            startOfToday,
            endOfToday,
            userId
        )
        return diary
    }

    postDiary = async (EmotionStatus, content, isPublic, weather, sentence, temperature, humid, sleep, imageUrl, todaySeoulTime, userId) => {
        const diary = await this.diaryRepository.postDiary(
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
        return diary
    }

    updateDiary = async (diaryId, content, isPublic) => {
        const updatedDiary = await this.diaryRepository.updateDiary(
            diaryId,
            content,
            isPublic
        )
        return updatedDiary
    }

    deleteDiary = async (diaryId, userId) => {
        const deletedDiary = await this.diaryRepository.deleteDiary(
            diaryId,
            userId
        )
        return deletedDiary
    }
}