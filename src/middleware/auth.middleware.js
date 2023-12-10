import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import dotenv from "dotenv";
import redis from "ioredis";

dotenv.config();

const client = new redis({
  host : process.env.REDIS_HOST,
  port : process.env.REDIS_PORT,
  password : process.env.REDIS_PASSWORD
});

export default async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const key = process.env.SECRET_KEY;

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== `Bearer`)
      throw new Error("토큰 타입이 일치하지 않습니다.");

    const verifyToken = jwt.verify(token, key);

    const userId = verifyToken.userId;

    const userInfo = await prisma.users.findFirst({
      where: { userId: userId },
    });
    if (!userInfo) throw new Error(`토큰 사용자가 존재하지 않습니다.`);

    req.user = userInfo;

    next();
  } catch (err) {
    try{
      if (err.name === "TokenExpiredError") {
        const key = process.env.SECRET_KEY;
        const { authorization, refreshtoken } = req.headers;
        const token = authorization.split(" ")[1];
        const userId = jwt.decode(token, key).userId;

        const storedRefreshToken = await client.get(`RefreshToken:${userId}`);
        if (storedRefreshToken === refreshtoken) {
          const newAccessToken = jwt.sign({ userId: +userId }, key, {
            expiresIn: "10s",
          });
          const newRefreshToken = jwt.sign({ userId: +userId }, key, {
            expiresIn: "7d" 
          })
          await client.set(`RefreshToken:${userId}`, newRefreshToken, "EX", 7 * 24 * 60 * 60 );
  
          res.setHeader("authorization", `Bearer ${newAccessToken}`);
          res.setHeader("refreshtoken", `${newRefreshToken}`);

          const userInfo = await prisma.users.findFirst({
            where: { userId: +userId },
          });

          req.user = userInfo;
          console.log("발급완료");

          next();
        }else{
          await client.del(`RefreshToken:${userId}`);
          res.setHeader("authorization", ``);
          res.setHeader("refreshtoken", ``);
          return res.status(400).json({message : '잘못된 접근입니다. 자동으로 로그아웃 됩니다.'})
        }
      }
    }catch(err){
      console.error(err);
      return res.status(500).json({message : "잘못된 접근입니다."})
    }
  }
};