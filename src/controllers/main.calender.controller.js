import { CalendarService } from '../services/main.calender.service.js'
import { CalendarSchema } from '../validation/joi.validation.js'
import { getDate, addHours } from "date-fns";

export class CalendarController {
    calendarService = new CalendarService()

    getCalendar = async (req, res, next) => {
        try{
            const { userId } = req.user;
            const { year, month } = await CalendarSchema.validateAsync(req.params);

            const startDate = new Date(year, month - 1, 1); // month는 0부터 시작하기 때문에 -1
            const endDate = new Date(year, month, 0);

            const diaries = await this.calendarService.getCalendar(
                userId,
                startDate,
                endDate
            )

            const modifiedDiaries = diaries.map((diary) => {
                const year = diary.createdAt.getFullYear();
                const month = diary.createdAt.getMonth() + 1;
                const date = diary.createdAt.getDate();

                diary.createdAt = `${year}. ${month}. ${date}.`; // 프론트에서 원하는 형식으로 데이터를 정리해서 보내주기 위한 코드
                return diary;
              });

            const userProfileImg = await this.calendarService.getProfileImg(
                userId
            )

            if (!userProfileImg) {
                userProfileImg = null;
            }

            const arrayedDiaries = new Array(getDate(endDate)).fill(null);

            modifiedDiaries.map((diary) => {
              let index = diary.createdAt.split(".")[2].trim();
              arrayedDiaries[index - 1] = diary;
              return arrayedDiaries;
            });

            return res.status(200).json({ data: arrayedDiaries, userProfileImg})
        } catch(err) {
            next(err)
        }
    }
}