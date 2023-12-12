import express from "express";
import UserRouter from "./routes/users.js";
import MainCalender from "./routes/main.calender.js";
import DiaryRouter from "./routes/diary.js";
import CommentsRouter from "./routes/comments.js";
import FeedsRouter from "./routes/feeds.js";
import githubLogin from './Oauth/github.login.js'
import kakaoLogin from './Oauth/kakao.login.js'
import googleLogin from './Oauth/google.login.js'
import cors from "cors";

const app = express();
const PORT = 3000;

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ["Authorization", "Refreshtoken", "Expiredtime"]
}

app.use(cors(corsOptions))

app.use(express.json());

app.use("/", [
  UserRouter,
  MainCalender,
  DiaryRouter,
  CommentsRouter,
  FeedsRouter,
  githubLogin,
  kakaoLogin,
  googleLogin
]);

app.get("/", (req, res) => {
  res.send(`<h1>Success</h1>`)
});
 
app.listen(PORT, () => {
  console.log(`${PORT}번 SERVER OPEN`);
});
 
export default app;
