import UsersRouter from './routes/users.router.js';
import OauthRouter from './routes/oauth.router.js';
import SecondaryCommentsRouter from './routes/secondaryComments.router.js';
import MainCalenderRouter from './routes/main.calender.router.js';
import FeedsRouter from './routes/feeds.router.js';
import DiaryRouter from './routes/diary.router.js';
import CommentsRouter from './routes/comments.router.js';
import initializeSocketIO from '../src/utils/io.js'
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http'
import './utils/deleteUserTask.js';
import cors from 'cors';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';

const app = express();
const PORT = 3000;
dotenv.config();

const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3000', 'https://nine-cloud9.vercel.app'],
  credentials: true,
  exposedHeaders: ['Authorization', 'Refreshtoken'],
};

const atlasURI = process.env.MONGO_DB;

mongoose.connect(atlasURI, {
useNewUrlParser: true,
useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

const swaggerDocument = YAML.load('./src/utils/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use('/', [UsersRouter, OauthRouter, SecondaryCommentsRouter, MainCalenderRouter, FeedsRouter, DiaryRouter, CommentsRouter]);
app.use(ErrorHandlingMiddleware);

app.get('/', (req, res) => {
  res.send('<h1>Success</h1>');
});

// health체크 엔드포인트
app.get("/health", (req, res) => {
  const isServerOnline = true;

  const serverStartTime = new Date().toISOString();

  const cpuUsage = os.loadavg()[0]; 
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const diskInfo = os.cpus(); 
  

  const healthStatus = {
    serverStatus: isServerOnline ? "Online" : "Offline",
    serverStartTime: serverStartTime,
    cpuUsage: cpuUsage,
    memoryUsage: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
    },
    diskSpace: diskInfo,
  };
  if (isServerOnline) {
    res.status(200).json(healthStatus);
  } else {
    res.status(503).json({ serverStatus: "Offline" });
  }
});

const server = http.createServer(app)

initializeSocketIO(server);

server.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`, 'server', server.address());
});
// app.listen(PORT, () => {
//   console.log(PORT, '포트로 서버가 열렸어요!');
// });
