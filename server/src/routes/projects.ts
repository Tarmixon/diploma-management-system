// server/src/routes/projects.ts
import express, { Request, Response } from 'express';
import { query } from '../db/index';

const router = express.Router();

// --- ЕМУЛЯТОР ЗОВНІШНЬОГО API ---
const checkRelevanceFromAPI = async (keywords: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!keywords) return 'Не визначено';
  const lowerKeywords = keywords.toLowerCase();
  
  if (lowerKeywords.includes('штучний інтелект') || lowerKeywords.includes('ai') || lowerKeywords.includes('react') || lowerKeywords.includes('node.js')) {
    return 'Висока (Актуальна)';
  } else if (lowerKeywords.includes('pascal') || lowerKeywords.includes('delphi') || lowerKeywords.includes('vba')) {
    return 'Низька (Застаріла)';
  }
  return 'Середня (Нова)';
};

// --- ОНОВЛЕНА ФУНКЦІЯ: Гнучкий підбір керівника ---
const findBestSupervisor = async (projectKeywords: string): Promise<number | null> => {
  if (!projectKeywords) return null;

  // Отримуємо всіх керівників з бази
  const result = await query('SELECT supervisor_id, specialization FROM supervisors WHERE specialization IS NOT NULL');
  const supervisors = result.rows;

  // Очищаємо ключові слова проєкту: переводимо в нижній регістр, 
  // замінюємо всі коми на пробіли і розбиваємо за будь-якою кількістю пробілів
  const pKeywords = projectKeywords
    .toLowerCase()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map(k => k.trim())
    .filter(k => k.length > 0); // видаляємо порожні елементи
  
  let bestMatchId: number | null = null;
  let maxMatches = 0;

  for (const sup of supervisors) {
    // Так само детально очищаємо спеціалізацію викладача з бази
    const sKeywords = sup.specialization
      .toLowerCase()
      .replace(/,/g, ' ')
      .split(/\s+/)
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    let currentMatches = 0;

    // Шукаємо часткові або повні збіги між словами
    for (const pk of pKeywords) {
      if (sKeywords.some((sk: string) => sk.includes(pk) || pk.includes(sk))) {
        currentMatches++;
      }
    }

    // Запам'ятовуємо викладача з найбільшою кількістю збігів
    if (currentMatches > maxMatches) {
      maxMatches = currentMatches;
      bestMatchId = sup.supervisor_id;
    }
  }

  return bestMatchId;
};

// 1. Отримати список усіх дипломних тем (GET /api/projects)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Використовуємо JOIN для об'єднання таблиць і отримання імен
    const result = await query(`
      SELECT 
        p.*, 
        u.name AS student_name, 
        s.name AS supervisor_name
      FROM projects p
      JOIN users u ON p.student_id = u.user_id
      LEFT JOIN supervisors s ON p.supervisor_id = s.supervisor_id
      ORDER BY p.project_id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Помилка отримання тем:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні списку тем' });
  }
});

// 2. Створити нову тему (POST /api/projects)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, description, keywords, student_id } = req.body;

  if (!title || !student_id) {
    res.status(400).json({ message: 'Назва теми та ID студента є обов\'язковими' });
    return;
  }

  try {
    // --- НОВЕ: Перевірка ліміту тем (1 активна тема на студента) ---
    const activeProjectCheck = await query(
      `SELECT project_id, status FROM projects 
       WHERE student_id = $1 AND status != 'відхилено'`,
      [student_id]
    );

    if (activeProjectCheck.rows.length > 0) {
      res.status(403).json({
        message: 'У вас вже є активна тема (на перевірці або затверджена). Ви можете подати нову лише якщо попередню буде відхилено.'
      });
      return;
    }
    // --- Перевірка на унікальність (Антиплагіат) ---
    const duplicateCheck = await query(
      `SELECT project_id, title FROM projects WHERE LOWER(title) LIKE LOWER($1)`,
      [`%${title.trim()}%`]
    );

    if (duplicateCheck.rows.length > 0) {
      res.status(409).json({
        message: 'Увага! Виявлено можливий плагіат. Схожа тема вже існує в базі.',
        existingTopic: duplicateCheck.rows[0].title
      });
      return;
    }
    // -----------------------------------------------------------

    // КРОК 1: Перевірка актуальності
    const relevanceScore = await checkRelevanceFromAPI(keywords);

    // КРОК 2: Автоматичний підбір керівника
    const assignedSupervisorId = await findBestSupervisor(keywords);

    // КРОК 3: Збереження в БД
    const result = await query(
      `INSERT INTO projects (title, description, keywords, student_id, supervisor_id, relevance) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description, keywords, student_id, assignedSupervisorId, relevanceScore]
    );

    const newProject = result.rows[0];

    // --- КРОК 4: Запис в історію ---
    await query(
      `INSERT INTO history (user_id, project_id, action) VALUES ($1, $2, $3)`,
      [student_id, newProject.project_id, 'Створення теми дипломного проєкту']
    );
    // -------------------------------------

    // --- КРОК 5 (НОВИЙ): Дістаємо ім'я призначеного керівника для гарного сповіщення ---
    let supervisorName = null;
    if (assignedSupervisorId) {
      const supRes = await query('SELECT name FROM supervisors WHERE supervisor_id = $1', [assignedSupervisorId]);
      if (supRes.rows.length > 0) {
        supervisorName = supRes.rows[0].name;
      }
    }

    res.status(201).json({
      message: assignedSupervisorId 
        ? 'Тему подано, унікальність підтверджено, керівника призначено!' 
        : 'Тему подано та перевірено (відповідного керівника не знайдено).',
      project: newProject
    });
  } catch (error: any) {
    console.error('Помилка створення теми:', error);
    res.status(500).json({ message: 'Помилка сервера при поданні теми' });
  }
});

// 3. Змінити статус теми (PATCH /api/projects/:id/status) - для Адміністратора
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // Отримуємо ID теми з URL
  const { status, admin_id } = req.body; // Отримуємо новий статус та ID адміна з тіла запиту

  // Перевіряємо, чи передано валідний статус, який підтримується БД
  const validStatuses = ['перевірка', 'затверджено', 'відхилено'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ 
      message: 'Недійсний статус. Використовуйте: перевірка, затверджено або відхилено' 
    });
    return;
  }

  // Перевіряємо, чи передано admin_id для запису в історію
  if (!admin_id) {
    res.status(400).json({ message: 'Необхідно передати admin_id для запису в історію дій.' });
    return;
  }

  try {
    // Змінюємо статус теми
    const result = await query(
      `UPDATE projects 
       SET status = $1 
       WHERE project_id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Тему з таким ID не знайдено' });
      return;
    }

    // --- ЗАПИС В ІСТОРІЮ ---
    await query(
      `INSERT INTO history (user_id, project_id, action) VALUES ($1, $2, $3)`,
      [admin_id, id, `Зміна статусу теми на "${status}"`]
    );
    // -----------------------

    res.json({
      message: `Статус теми успішно змінено на "${status}"!`,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Помилка оновлення статусу:', error);
    res.status(500).json({ message: 'Помилка сервера при оновленні статусу' });
  }
});

// 4. Видалити тему (DELETE /api/projects/:id) - для Адміністратора
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { admin_id } = req.query;

  if (!admin_id) {
    res.status(400).json({ message: 'Необхідно передати admin_id для підтвердження прав.' });
    return;
  }

  try {
    const checkProject = await query('SELECT title FROM projects WHERE project_id = $1', [id]);
    if (checkProject.rows.length === 0) {
      res.status(404).json({ message: 'Тему не знайдено' });
      return;
    }

    const projectTitle = checkProject.rows[0].title;

    // Відв'язуємо існуючу історію від project_id, щоб уникнути помилки Foreign Key, але зберегти аудит
    await query('UPDATE history SET project_id = NULL WHERE project_id = $1', [id]);

    // Видаляємо саму тему
    await query('DELETE FROM projects WHERE project_id = $1', [id]);

    // Фіксуємо факт видалення в історії (project_id = NULL)
    await query(
      `INSERT INTO history (user_id, project_id, action) VALUES ($1, NULL, $2)`,
      [admin_id, `Видалення теми: "${projectTitle}"`]
    );

    res.json({ message: `Тему успішно видалено з системи.` });
  } catch (error) {
    console.error('Помилка видалення теми:', error);
    res.status(500).json({ message: 'Помилка сервера при видаленні теми' });
  }
});

// 5. Отримати список усіх керівників для випадаючого списку (GET /api/projects/supervisors/all)
router.get('/supervisors/all', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT supervisor_id, name, specialization FROM supervisors ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Помилка отримання списку керівників:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні керівників' });
  }
});

// 6. Призначити керівника вручну (PATCH /api/projects/:id/supervisor)
router.patch('/:id/supervisor', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { supervisor_id, admin_id } = req.body;

  if (!admin_id) {
    res.status(400).json({ message: 'Необхідно передати admin_id для історії.' });
    return;
  }

  try {
    // Перетворюємо порожнє значення на NULL, якщо адмін зняв керівника
    const supId = supervisor_id ? parseInt(supervisor_id) : null;

    const result = await query(
      `UPDATE projects SET supervisor_id = $1 WHERE project_id = $2 RETURNING *`,
      [supId, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Тему не знайдено' });
      return;
    }

    // Дістаємо ім'я нового керівника для запису в історію
    let supName = 'Не призначено (знято адміном)';
    if (supId) {
      const supRes = await query('SELECT name FROM supervisors WHERE supervisor_id = $1', [supId]);
      if (supRes.rows.length > 0) supName = supRes.rows[0].name;
    }

    // Записуємо дію в історію
    await query(
      `INSERT INTO history (user_id, project_id, action) VALUES ($1, $2, $3)`,
      [admin_id, id, `Ручне призначення керівника: ${supName}`]
    );

    res.json({ message: 'Керівника успішно оновлено!' });
  } catch (error) {
    console.error('Помилка ручного призначення:', error);
    res.status(500).json({ message: 'Помилка сервера при призначенні керівника' });
  }
});

// 7. Редагування теми студентом (PUT /api/projects/:id)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, keywords, student_id } = req.body;

  if (!student_id || !title || !description || !keywords) {
    res.status(400).json({ message: 'Заповніть усі обов\'язкові поля.' });
    return;
  }

  try {
    // 1. Антиплагіат: перевіряємо, чи немає такої ж назви серед ІНШИХ тем (крім поточної)
    const duplicateCheck = await query(
      'SELECT project_id FROM projects WHERE title ILIKE $1 AND project_id != $2',
      [title, id]
    );
    if (duplicateCheck.rows.length > 0) {
      res.status(409).json({ message: 'Інший проєкт з такою назвою вже існує в базі.' });
      return;
    }

    // 2. Якщо студент змінив ключові слова, система має перепризначити ідеального керівника
    const newSupervisorId = await findBestSupervisor(keywords);

    // 3. Оновлюємо дані та автоматично повертаємо статус на "перевірка"
    await query(
      `UPDATE projects 
       SET title = $1, description = $2, keywords = $3, status = 'перевірка', supervisor_id = $4 
       WHERE project_id = $5 AND student_id = $6`,
      [title, description, keywords, newSupervisorId, id, student_id]
    );

    // 4. Фіксуємо дію в аудиті
    await query(
      'INSERT INTO history (user_id, project_id, action) VALUES ($1, $2, $3)',
      [student_id, id, 'Редагування теми студентом (відправлено на повторну перевірку)']
    );

    res.json({ message: 'Тему успішно оновлено та відправлено на перевірку!' });
  } catch (error) {
    console.error('Помилка редагування теми:', error);
    res.status(500).json({ message: 'Помилка сервера при редагуванні теми' });
  }
});

export default router;