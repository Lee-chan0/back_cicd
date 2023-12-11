import express from "express";
import UserRouter from "./routes/users.js";
import MainCalender from "./routes/main.calender.js";
import DiaryRouter from "./routes/diary.js";
import CommentsRouter from "./routes/comments.js";
import FeedsRouter from "./routes/feeds.js";
import cors from "cors";

const app = express();
const PORT = 3000;

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
}

app.use(cors(corsOptions,  {
    exposedHeaders: ["Authorization", "Refreshtoken"],
  }))

// app.use(cors(
//     {
//     origin: 'http://localhost:3000',
//     credentials: true,
//     exposedHeaders: ["Authorization", "Refreshtoken"],
//   }
// ));
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
