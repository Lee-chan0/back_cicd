import express from "express";
import UserRouter from "./routes/users.js";
import MainCalender from "./routes/main.calender.js";
import DiaryRouter from "./routes/diary.js";
import CommentsRouter from "./routes/comments.js";
import FeedsRouter from "./routes/feeds.js";
import naverLogin from './Oauth/naver.login.js'
import kakaoLogin from './Oauth/kakao.login.js'
import googleLogin from './Oauth/google.login.js'
import cors from "cors";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from 'swagger-ui-express';
import bodyparser from 'body-parser'
import { options  } from '../src/utils/swagger.js'
import swaggerDocument from ''

const app = express();
const PORT = 3000;

/* swagger */
const specs = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))

app.use(express.urlencoded({ extended: true }))

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ["Authorization", "Refreshtoken", "Expiredtime"]
}


app.use(express.urlencoded({extended : true}))
app.use(cors(corsOptions));
app.use(express.json());



app.use("/", [
  UserRouter,
  MainCalender,
  DiaryRouter,
  CommentsRouter,
  FeedsRouter,
  naverLogin,
  kakaoLogin,
  googleLogin
]);

app.get("/", (req, res) => {
  res.send(`<h1>Success</h1>`);
});

app.listen(PORT, () => {
  console.log(`${PORT}번 SERVER OPEN`);
});
 

export default app;
