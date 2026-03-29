# 🦷 Dental Clinic - Стоматологическая клиника

Полнофункциональное веб-приложение для управления записями в стоматологической клинике. Пациенты могут регистрироваться, просматривать врачей, записываться на приёмы и управлять своими записями. Врачи просматривают свои профили и список пациентов. Администраторы управляют всеми данными системы.

---

## ✨ Основные возможности

- **Пациенты**: регистрация, просмотр врачей, запись на приём, управление своими записями
- **Врачи**: просмотр профиля, список приёмов пациентов
- **Администраторы**: полное управление врачами (CRUD), пациентами и записями
- **Безопасность**: JWT токены, хеширование паролей (bcrypt)
- **Загрузка фото**: врачи могут загружать свои фотографии
- **Отзывчивый дизайн**: работает на всех устройствах

---

## 🛠️ Технический стек

### Frontend
- **React 19.2.4** — UI библиотека
- **React Router DOM 7.13.1** — маршрутизация  
- **CSS3** — стилизация

### Backend
- **Express.js 5.2.1** — веб-фреймворк
- **Node.js** — runtime
- **SQLite3 6.0.1** — база данных
- **JWT (jsonwebtoken 9.0.3)** — аутентификация пользователей
- **Bcrypt 6.0.0** — хеширование паролей
- **Helmet 7.0.0** — HTTP security headers
- **Multer 2.1.1** — загрузка файлов (фото врачей)
- **CORS** — кросс-доменные запросы
- **Dotenv 16.3.1** — управление переменными окружения

### Dev Tools
- **Nodemon 3.0.1** — автоперезагрузка backend при изменениях
- **Concurrently 8.2.0** — одновременный запуск React + Node

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск в режиме разработки

```bash
npm run dev
```

Откроется приложение на `http://localhost:3000`, backend запустится автоматически на порту 5000.

### 3. Альтернативные команды

```bash
# Только frontend (React)
npm start

# Только backend (Node)
npm run server:dev

# Build для production
npm run build

# Запуск production версии
npm run start:prod
```

---

## 📚 Администраторский доступ

Для входа в админ-панель используйте учетные данные по умолчанию:

- **Email**: `admin@example.com`
- **Пароль**: `123456`
- **URL**: `http://localhost:3000/admin`

---

## 📁 Структура проекта

```
dental-clinic/
├── server.js                      # Entry point для backend
├── Procfile                       # Конфигурация для деплоя
├── package.json                   # Зависимости и скрипты
│
├── public/                        # Статические файлы
│   └── index.html                 # HTML шаблон
│
├── src/
│   ├── App.js                     # Корневой компонент React
│   ├── index.js                   # React DOM рендер
│   ├── config.js                  # Конфигурация backend (из .env)
│   ├── db.js                      # Слой работы с БД
│   ├── server-core.js             # Все Express маршруты и API
│   │
│   ├── api/
│   │   └── config.js              # Конфигурация API URL для frontend
│   │
│   ├── components/
│   │   ├── auth/                  # Регистрация и вход
│   │   ├── navbar/                # Навигация
│   │   ├── header/                # Шапка главной страницы
│   │   ├── footer/                # Подвал
│   │   ├── appointment/           # Модальное окно записи на приём
│   │   └── dantist/               # Карточка врача
│   │
│   ├── pages/
│   │   ├── Home.js                # Главная страница
│   │   ├── Dantists.js            # Список врачей
│   │   ├── Profile.js             # Профиль пользователя
│   │   ├── Admin.js               # Админ-панель
│   │   └── Contacts.js            # Контакты
│   │
│   ├── styles/                    # Глобальные стили
│   │   ├── main.css               # Основные стили
│   │   ├── profile.css            # Стили профиля
│   │   ├── admin.css              # Стили админ-панели
│   │   └── reset.css              # Нормализация стилей
│   │
│   └── img/                       # Изображения проекта
│       ├── dantist/               # Фото врачей (уже загаруженные)
│       └── icons/                 # Иконки
│
├── .env.local                     # Переменные окружения для разработки (НЕ коммитить!)
├── .gitignore                     # Файлы, исключённые из git
├── dentalClinicDB.db              # База данных SQLite с данными (на GitHub!)
└── Procfile                       # Конфигурация для деплоя
```

---

## 📚 Все API маршруты

### Аутентификация
- `POST /auth/register` — Регистрация (email, password, role)
- `POST /auth/login` — Вход (email, password)
- `POST /admin/login` — Вход администратора (email, password)

### Врачи
- `GET /doctors` — Список всех врачей
- `GET /doctors/:id` — Данные одного врача
- `POST /admin/doctors` — Добавить врача (админ)
- `PUT /admin/doctors/:id` — Редактировать врача (админ)
- `DELETE /admin/doctors/:id` — Удалить врача (админ)

### Пользователи
- `GET /profile` — Профиль текущего пользователя (нужен token)
- `PUT /profile` — Редактировать профиль (нужен token)
- `GET /admin/users` — Список всех пользователей (админ)
- `DELETE /admin/users/:id` — Удалить пользователя (админ)

### Записи на приём
- `POST /appointments` — Создать запись (пациент)
- `GET /appointments` — Список своих записей (пациент)
- `DELETE /appointments/:id` — Отменить запись (пациент)
- `GET /admin/appointments` — Список всех записей (админ)
- `DELETE /admin/appointments/:id` — Удалить запись (админ)

### Фото врачей
- `POST /upload-photo`— Загрузить фото врача (многочастевой запрос)
- `GET /img/dantist/*` — Получить фото врача (статический файл)

---

## ✨ Структура данных

**users** — таблица пользователей
```sql
- user_id (INTEGER PRIMARY KEY AUTOINCREMENT)
- email (TEXT UNIQUE NOT NULL)
- password_hash (TEXT NOT NULL)
- role_id (SMALLINT NOT NULL)
```

**patients** — таблица пациентов
```sql
- patient_id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER, FOREIGN KEY REFERENCES users(user_id))
- first_name (TEXT NOT NULL)
- last_name (TEXT NOT NULL)
- phone_number (TEXT)
- address (TEXT)
```

**doctors** — таблица врачей
```sql
- doctor_id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER, FOREIGN KEY REFERENCES users(user_id))
- first_name (TEXT NOT NULL)
- last_name (TEXT NOT NULL)
- specialization (TEXT NOT NULL)
- experience_years (INTEGER)
- photo_url (TEXT)
```

**appointments** — таблица записей
```sql
- appointment_id (INTEGER PRIMARY KEY AUTOINCREMENT)
- patient_id (INTEGER, FOREIGN KEY REFERENCES patients(patient_id))
- doctor_id (INTEGER, FOREIGN KEY REFERENCES doctors(doctor_id))
- appointment_date (DATETIME NOT NULL)
- service_type (TEXT NOT NULL)
```

---

## 🚀 Production команды

```bash
# Сборка frontend
npm run build

# Запуск production сервера (после build)
npm run start:prod

# Эквивалент для Render (автоматически)
npm install && npm run build && node server.js
```

---


## 👤 Автор

Курсовой проект студента группы 4ИСПр, 2026 год  
GitHub: [ImNotDarKing](https://github.com/ImNotDarKing)
Railway: https://web-production-b8064e.up.railway.app/
