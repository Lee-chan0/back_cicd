import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UsersRouter from './routes/users.router.js';
import OauthRouter from './routes/oauth.router.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import initializeSocketIO from '../src/utils/io.js'
import http from 'http'
import './utils/deleteUserTask.js';

const app = express();
const PORT = 3000;
dotenv.config();

const atlasURI = process.env.MONGO_DB;

mongoose.connect(atlasURI, {
useNewUrlParser: true,
useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

app.use(express.json());
app.use('/', [UsersRouter, OauthRouter]);
app.use(ErrorHandlingMiddleware);



const server = http.createServer(app)

initializeSocketIO(server);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
