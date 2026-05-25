import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db/index'; 
import historyRoutes from './routes/history';

// 1. Імпортуємо роути користувачів
import userRoutes from './routes/users'; 
import supervisorRoutes from './routes/supervisors';
import projectRoutes from './routes/projects';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ваш тестовий роут БД (залишаємо)
app.get('/api/db-test', async (req: Request, res: Response) => {
  // ... ваш попередній код
});

// 2. Підключаємо роути користувачів до шляху
app.use('/api/users', userRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/history', historyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});