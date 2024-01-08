import express from 'express';
import {UsersController} from '../controllers/users.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import imageUpload from '../middlewares/S3.upload/usereditS3.js';

const router = express.Router();

const usersController = new UsersController();

router.post('/signup', usersController.sendSignupMail);
router.post('/complete-signup', usersController.completeSignUp);
router.post('/signin', usersController.SignIn);
router.post('/token', usersController.tokenReissue);
router.get('/myInfo',authMiddleware, usersController.findMyInfo);
router.patch('/myInfo/editmyInfo', authMiddleware, imageUpload.single("image"), usersController.editMyInfo);
router.patch('/myInfo/edit-pw', authMiddleware, usersController.editPassWord);
router.delete('/signoff', authMiddleware, usersController.signOffUser);
router.post('/cancel-signoff', usersController.cancelSignOff);


export default router;