import { startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";


const clientDate = new Date("2024-01-02T05:36:01.963Z"); // 클라이언트에서 전달된 값
const serverTimeZone = "Asia/Seoul"; // 서버의 시간대

// 클라이언트에서 전달된 값(clientDate)을 서버의 시간대(serverTimeZone)로 변환
const serverDate = utcToZonedTime(clientDate, serverTimeZone);

console.log(serverDate); // 변환된 서버 시간대의 날짜