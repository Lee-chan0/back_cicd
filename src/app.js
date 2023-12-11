import express from "express";
import UserRouter from "./routes/users.js";
import MainCalender from "./routes/main.calender.js";
import DiaryRouter from "./routes/diary.js";
import CommentsRouter from "./routes/comments.js";
import FeedsRouter from "./routes/feeds.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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