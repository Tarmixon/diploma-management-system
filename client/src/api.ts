import axios from 'axios';

const api = axios.create({
  // Вставляємо пряме посилання на ваш живий бекенд
  baseURL: 'https://diploma-management-system.onrender.com/api',
});

export default api;
