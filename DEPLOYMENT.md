# 🚀 Развертывание на Render.com

## Проблема в deployment

При развертывании на Render получается ошибка:
```
sh: 1: react-scripts: not found
```

**Причина**: `npm install` должен запуститься перед `npm run build`, но это не произошло автоматически.

## Решение: файл render.yaml

Проект теперь содержит файл `render.yaml` который явно указывает Render.com:

1. **buildCommand** — установить зависимости И собрать React приложение
2. **startCommand** — запустить Node.js сервер
3. **envVars** — переменные окружения для production

## Шаги развертывания

### 1. Push на GitHub

```bash
git add .
git commit -m "Add Render deployment config"
git push origin master
```

### 2. На Render.com

1. Откройте [render.com](https://render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите Git репозиторий `dental-clinic`
4. Следующий шаг остановится и предложит создать **render.yaml**
   - ✅ Файл **уже есть в проекте** — просто нажмите _Continue_
5. Render автоматически прочитает render.yaml и настроит:
   - Build команду: `npm ci && npm run build`
   - Start команду: `NODE_ENV=production node server.js`
   - Переменные окружения для production

### 3. Environment Variables на Render.com

Если нужно переопределить значения (например, для production):

В Render Dashboard → Settings → Environment Variables добавьте:

| Ключ | Значение |
|------|----------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (автоматически) |
| `CORS_ORIGIN` | `https://your-app.onrender.com` |
| `REACT_APP_BACKEND_URL` | `https://your-app.onrender.com` |
| `JWT_SECRET` | укажите secure secret |
| `ADMIN_PASSWORD` | укажите secure password |

**Примечание**: остальные переменные из `.env.local` будут подхвачены автоматически.

## Что изменилось в коде

### render.yaml
- Явные инструкции для build (`npm ci`) и запуска
- Переменные окружения для production

### src/server-core.js
- Добавлено serve статических файлов React build в production режиме
- Добавлен catch-all route для поддержки client-side routing

### Procfile
- Обновлен для совместимости с Render

## Логика работы в production

1. **Build фаза** (Render выполняет при каждом push):
   - `npm ci` — установить точные версии зависимостей
   - `npm run build` — собрать React приложение в папку `/build`

2. **Runtime фаза** (Render запускает сервер):
   - `node server.js` — запустить Express сервер
   - Express подает статические файлы из `/build`
   - React Router на frontend обрабатывает клиентскую маршрутизацию
   - API routes работают обычным путем

## Локальное тестирование production build

Перед deploy можно проверить локально:

```bash
npm run build
NODE_ENV=production npm run start:prod
```

Приложение будет доступно на `http://localhost:3000`

## FAQ

**Q: Почему `npm ci` вместо `npm install`?**
A: `npm ci` (clean install) гарантирует точные версии из package-lock.json. Лучше для production.

**Q: Как обновить переменные окружения?**
A: Через Render Dashboard Settings → Environment Variables. После изменения нажмите "Deploy" для перезагрузки.

**Q: Что делать, если build все еще падает?**
A: Проверьте логи в Render Dashboard → Logs. Там будете видеть точную ошибку.

**Q: Используется ли .env.local в production?**
A: Нет. На Render используются переменные из Dashboard. Если хотите использовать .env.local, добавьте в render.yaml `source: "/env.local"` (но это не рекомендуется для production).
