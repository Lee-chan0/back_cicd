// import express from 'express';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import UserRouter from './routes/users.js';
// import MainCalender from './routes/main.calender.js';
// import DiaryRouter from './routes/diary.js';
// import CommentsRouter from './routes/comments.js';
// import FeedsRouter from './routes/feeds.js';
// import naverLogin from './Oauth/naver.login.js';
// import kakaoLogin from './Oauth/kakao.login.js';
// import googleLogin from './Oauth/google.login.js';
// import swaggerUi from 'swagger-ui-express';
// import YAML from 'yamljs';
// import initializeSocketIO from './utils/io.js';

// const app = express();
// const PORT = 3000;

// dotenv.config();

// const corsOptions = {
//   origin: 'http://localhost:3000',
//   credentials: true,
//   exposedHeaders: ['Authorization', 'Refreshtoken', 'Expiredtime'],
// };
// const atlasURI = process.env.DB;

// mongoose.connect(atlasURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB Atlas'))
// .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// const swaggerDocument = YAML.load('./src/utils/swagger.yaml');

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// app.use(express.urlencoded({ extended: true }));
// app.use(cors(corsOptions));

// app.use('/', [
//   UserRouter,
//   MainCalender,
//   DiaryRouter,
//   CommentsRouter,
//   FeedsRouter,
//   naverLogin,
//   kakaoLogin,
//   googleLogin,
// ]);

// app.get('/', (req, res) => {
//   res.send('<h1>Success</h1>');
// });

// const server = app.listen(PORT, () => {
//   console.log(`Express server listening on port ${PORT}`, 'server', server.address());
// });
// const io =  new Server(server, {
//   path: '/community/chat',
//   cors: corsOptions
// })
// initializeSocketIO(io);

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
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();
const PORT = 3000


const swaggerDocument = YAML.load(('./src/utils/swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }))

app.use(express.urlencoded({ extended: true }))

const corsOptions = {
  origin: ['https://first-deploy-xi.vercel.app', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ["Authorization", "Refreshtoken", "Expiredtime"]
};


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
