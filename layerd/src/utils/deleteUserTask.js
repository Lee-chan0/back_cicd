import cron from 'node-cron';
import { UsersService } from '../services/users.service.js';

const usersService = new UsersService();

cron.schedule("0 * * * *", async() => {
    await usersService.deleteExpiredUsers();
},
{
    scheduled: true,
    timezone: "Asia/Seoul"
});