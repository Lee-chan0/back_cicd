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
    console.log('-=----------------');
    const {authorization} = req.headers;
    console.log("asdfasdfjkdsajfksdj ", authorization);
    console.log(req.headers);
    const key = process.env.SECRET_KEY;
    console.log(1);

//    if(!Authorization){return res.status(404).json({msg : "123"})}

    const [tokenType, token] = authorization.split(" ");
    console.log(2);

    if (tokenType !== `Bearer`)
      throw new Error("토큰 타입이 일치하지 않습니다.");
    console.log(3);
    const verifyToken = jwt.verify(token, key);
    console.log(4)
    const userId = verifyToken.userId;

    const userInfo = await prisma.users.findFirst({
      where: { userId: userId },
    });
    if (!userInfo) throw new Error(`토큰 사용자가 존재하지 않습니다.`);

    req.user = userInfo;

    console.log(5);
    next();
  } catch (err) {
    console.error(err);
    console.log('asdf');
    try{
      if (err.name === "TokenExpiredError") {
        console.log(1234567);
        const key = process.env.SECRET_KEY;
        const { authorization, refreshtoken } = req.headers;
        const token = authorization.split(" ")[1];
        const userId = jwt.decode(token, key).userId;

        const storedRefreshToken = await client.get(`RefreshToken:${userId}`);
        if (storedRefreshToken === refreshtoken) {
          const newAccessToken = jwt.sign({ userId: +userId }, key, {
            expiresIn: "30m",
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
          res.setHeader("Authorization", ``);
          res.setHeader("Refreshtoken", ``);
          return res.status(400).json({message : '잘못된 접근입니다. 자동으로 로그아웃 됩니다.'})
        }
      }
    }catch(err){
      console.error(err);
      return res.status(500).json({message : "잘못된 접근입니다."})
    }
  }
};