// server/src/routes/supervisors.ts
import express, { Request, Response } from 'express';
import { query } from '../db/index';

const router = express.Router();

// 1. Отримати список усіх керівників (GET /api/supervisors)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM supervisors');
    res.json(result.rows);
  } catch (error) {
    console.error('Помилка отримання керівників:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні списку керівників' });
  }
});

// 2. Додати нового наукового керівника (POST /api/supervisors)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, department, specialization } = req.body;

  // Перевіряємо лише ім'я, оскільки кафедра та спеціалізація не є NOT NULL у вашій БД
  if (!name) {
    res.status(400).json({ message: 'Поле "name" (ПІБ керівника) є обов\'язковим' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO supervisors (name, department, specialization) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, department, specialization]
    );

    res.status(201).json({
      message: 'Наукового керівника успішно додано!',
      supervisor: result.rows[0]
    });
  } catch (error: any) {
    console.error('Помилка додавання керівника:', error);
    res.status(500).json({ message: 'Помилка сервера при додаванні керівника' });
  }
});

export default router;