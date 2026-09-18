// server/src/routes/users.ts
import express, { Request, Response } from 'express';
import { query } from '../db/index';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
  const { name, email, password, role, department, specialization } = req.body;

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

    if (userRole === 'teacher') {
          await query(
            `INSERT INTO supervisors (name, department, specialization) 
             VALUES ($1, $2, $3)`,
            [name, department || 'Кафедра АСУ', specialization || 'Загальна']
          );
        }
    
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

// --- 1. ЗАПИТ НА ВІДНОВЛЕННЯ ПАРОЛЯ (Генерація токена та відправка листа) ---
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    // 1. Шукаємо користувача
    const userResult = await query('SELECT user_id, name FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ message: 'Користувача з таким email не знайдено' });
      return;
    }

    // 2. Генеруємо безпечний випадковий токен та час його дії (1 година)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // Поточний час + 1 година у мілісекундах

    // 3. Зберігаємо токен у БД
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, tokenExpiry, email]
    );

    // 4. Налаштовуємо "поштаря" Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Використовуємо SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        // Допомагає обійти деякі суворі мережеві перевірки на хмарних серверах
        rejectUnauthorized: false
      }
    });

    // 5. Формуємо посилання та відправляємо лист
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: `"Система DipPom" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Відновлення пароля до системи DipPom',
      html: `
        <h3>Вітаємо, ${userResult.rows[0].name}!</h3>
        <p>Ви отримали цей лист, оскільки був зроблений запит на відновлення пароля для вашого акаунту.</p>
        <p>Щоб створити новий пароль, перейдіть за посиланням нижче (воно дійсне 1 годину):</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Відновити пароль</a>
        <p>Якщо ви не робили цього запиту, просто проігноруйте цей лист.</p>
      `
    });

    res.json({ message: 'Інструкції з відновлення надіслано на вашу пошту' });
  } catch (error) {
    console.error('Помилка відновлення пароля:', error);
    res.status(500).json({ message: 'Помилка сервера при відправці листа' });
  }
});

// --- 2. ВСТАНОВЛЕННЯ НОВОГО ПАРОЛЯ ---
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    // 1. Шукаємо користувача з таким токеном, який ще не протермінувався
    const userResult = await query(
      'SELECT user_id FROM users WHERE reset_token = $1 AND reset_token_expiry > $2',
      [token, Date.now()]
    );

    if (userResult.rows.length === 0) {
      res.status(400).json({ message: 'Токен недійсний або його час дії вичерпано' });
      return;
    }

    // 2. Хешуємо новий пароль
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 3. Оновлюємо пароль у БД і зачищаємо токен (щоб його не можна було використати вдруге)
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
      [passwordHash, userResult.rows[0].user_id]
    );

    res.json({ message: 'Ваш пароль успішно змінено! Тепер ви можете увійти.' });
  } catch (error) {
    console.error('Помилка скидання пароля:', error);
    res.status(500).json({ message: 'Помилка сервера при зміні пароля' });
  }
});

export default router;
