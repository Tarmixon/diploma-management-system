// client/src/api.ts
import axios from 'axios';

// Створюємо базовий екземпляр axios, який завжди звертатиметься до нашого бекенду
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;