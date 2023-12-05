import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validAccountInfo } from "../middlewares/error.handler/joi.error.definition.js";

const router = express.Router();

/* 회원가입 */
router.post("/signup", async (req, res, next) => {
  try {
    const { email, nickname, password, job } =
      await validAccountInfo.validateAsync(req.body);

    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 가입된 email 입니다" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        email,
        nickname,
        password: hashedPassword,
        job,
      },
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 로그인 API */
router.post("/signin", async (req, res, next) => {
  try {
    const { email, password } = await validAccountInfo.validateAsync(req.body);
    const user = await prisma.users.findFirst({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ message: "해당 email로 가입된 계정이 없습니다" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다" });
    }

    const token = jwt.sign({ userId: user.userId }, "secretKey", {
      expiresIn: "1h",
    });

    res.cookie("authorization", `Bearer ${token}`);
    return res
      .status(200)
      .json({
        message: `${user.nickname}님 로그인에 성공하셨습니다`,
        data: user, // data 부분은 테스팅이 끝난 후에는 삭제할것 ** 유출되면 안되는 개인정보 **
      });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 내 정보 조회 */
router.get("/myInfo", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        email: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ data: user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 회원 탈퇴 */
router.delete("/signoff", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!userId) {
      return res
        .status(400)
        .json({ message: "이미 처리되었거나 만료된 페이지입니다" }); // 만료되었을 때 따로 예외처리를 할 수도 있도록 재설계 필요
    }

    await prisma.users.delete({
      where: { userId: +userId },
    });

    return res.status(200).json({ message: "탈퇴처리 되었습니다" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

/* 로그아웃 */
router.post("/signout", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({ message: "로그인이 되어있지 않습니다" });
    }
    res.clearCookie("authorization");
    return res.status(200).json({ message: "로그아웃 성공" });
    // 추가적으로 client가 이미 가지고있는 token 무효화나 세션 비활성화 등을 고려해야함
    // refresh token 등을 사용할경우에 따라 코드 추가, 수정 필요함
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
