import { CalendarRepository } from '../repositories/main.calender.repository.js'

export class CalenderService {
    calendarRepository = CalendarRepository();

    getCalendar = async (userId, startDate, endDate) => {
        const diaries = await this.calendarRepository.getCalendar(
            userId,
            startDate,
            endDate
        )

        return diaries
    }

    getProfileImg = async (userId) => {
        const profileImg = await this.calendarRepository.getProfileImg(
            userId
        )

        return profileImg
    }
}