import express, { Request, Response } from 'express';
import { query } from '../db/index';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        h.id, 
        u.name AS user_name, 
        COALESCE(p.title, '[Тема видалена з БД]') AS project_title, 
        h.action, 
        h.timestamp
      FROM history h
      JOIN users u ON h.user_id = u.user_id
      LEFT JOIN projects p ON h.project_id = p.project_id
      ORDER BY h.timestamp DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Помилка отримання історії:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні історії дій' });
  }
});

export default router;