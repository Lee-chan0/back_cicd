import express from "express";
import UserRouter from "./routes/users.js";
import MainCalender from "./routes/main.calender.js";
import DiaryRouter from "./routes/diary.js";
import CommentsRouter from "./routes/comments.js";
import FeedsRouter from "./routes/feeds.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", 'http://localhost:3000');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Refreshtoken");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200); // OPTIONS 요청에 대한 응답으로 200을 보냅니다.
  } else {
    next();
  }
});

// app.use(cors(
//     {
//     origin: 'http://localhost:3000',
//     credentials: true,
//     exposedHeaders: ["Authorization", "Refreshtoken"],
//   }
// ));
// app.use(express.json());

app.use("/", [
  UserRouter,
  MainCalender,
  DiaryRouter,
  CommentsRouter,
  FeedsRouter,
]);

app.get("/", (req, res) => {
  res.send(`<h1>Success</h1>`)
});

app.listen(PORT, () => {
  console.log(`${PORT}번 SERVER OPEN`);
});

export default app;
