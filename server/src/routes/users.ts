// server/src/routes/users.ts
import express, { Request, Response } from 'express';
import { query } from '../db/index';
import bcrypt from 'bcrypt';

const router = express.Router();

// 1. Отримати список усіх користувачів (GET /api/users)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Витягуємо всіх користувачів, але не показуємо паролі задля безпеки
    const result = await query('SELECT user_id, name, email, role FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Помилка отримання користувачів:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні користувачів' });
  }
});

// 2. Створити нового користувача (POST /api/users)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Будь ласка, заповніть всі обов\'язкові поля (name, email, password)' });
    return;
  }

  try {
    // 2. Хешуємо пароль за допомогою bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds); 
    
    const userRole = role || 'student';

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, name, email, role`,
      [name, email, passwordHash, userRole] // 3. Використовуємо passwordHash замість dummy
    );

    res.status(201).json({
      message: 'Користувача успішно створено!',
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Помилка створення користувача:', error);
    // Обробка помилки унікальності (якщо email вже існує)
    if (error.code === '23505') {
      res.status(400).json({ message: 'Користувач з таким email вже існує' });
    } else {
      res.status(500).json({ message: 'Помилка сервера при створенні користувача' });
    }
  }
});

// 3. Авторизація користувача (POST /api/users/login)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Введіть email та пароль' });
    return;
  }

  try {
    // Шукаємо користувача за email
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Користувача з таким email не знайдено' });
      return;
    }

    const user = result.rows[0];

    // Перевіряємо пароль за допомогою bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      res.status(401).json({ message: 'Невірний пароль' });
      return;
    }

    // Якщо все добре, повертаємо дані користувача (без пароля!)
    res.json({
      message: 'Успішний вхід!',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Помилка авторизації:', error);
    res.status(500).json({ message: 'Помилка сервера при вході' });
  }
});

export default router;