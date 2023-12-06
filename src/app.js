import express from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'

import UserRouter from "./routes/users.js"
import MainCalendar from "./routes/main.calendar.js"
import diary from "./routes/diary.js"

const app = express()
const PORT = 3000

app.use(cors()); // CORS 설정 추가. 추후에 디테일한 cors 설정 필요

app.use(express.json())
app.use(cookieParser())
app.use("/", [UserRouter, MainCalendar, diary])

app.listen(PORT, () => {
    console.log(PORT, "포트로 서버가 열렸어요")
})

export default app