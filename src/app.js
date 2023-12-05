import express from "express"
import cookieParser from "cookie-parser"

import UserRouter from "./routes/users.js"
import MainCalendar from "./routes/main.calendar.js"
import diary from "./routes/diary.js"


const app = express()
const PORT = 3000

app.use(express.json())
app.use(cookieParser())
app.use("/", [UserRouter, MainCalendar, diary])

app.listen(PORT, () => {
    console.log(PORT, "포트로 서버가 열렸어요")
})

export default app