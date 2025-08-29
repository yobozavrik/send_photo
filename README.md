# 📸 Загрузка изображений в Google Drive

Веб-приложение для загрузки изображений в Google Drive с использованием Service Account.

## 🤖 Telegram WebApp

Приложение можно открыть как [WebApp бота Telegram](https://core.telegram.org/bots/webapps). После успешной загрузки файла в Google Drive страница отправляет данные (ID файла, имя и ссылку просмотра) обратно боту через `Telegram.WebApp.sendData` и закрывает окно.

## 🚀 Быстрый старт

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте Google Cloud Console:**
   - Создайте проект в Google Cloud Console
   - Включите Google Drive API
   - Создайте Service Account и скачайте JSON-ключ

3. **Настройте переменные окружения:**
   ```bash
   cp env.example .env
   # Отредактируйте .env файл
   ```

4. **Запустите сервер:**
   ```bash
   npm start
   ```

5. **Откройте браузер:**
   ```
   http://localhost:3000
   ```

## 📋 Подробная настройка

### 1. Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Запомните ID проекта (понадобится позже)

### 2. Включение Google Drive API

1. В Google Cloud Console перейдите в раздел **"APIs & Services" > "Library"**
2. Найдите **"Google Drive API"**
3. Нажмите **"Enable"** (Включить)

### 3. Создание Service Account

1. Перейдите в **"APIs & Services" > "Credentials"**
2. Нажмите **"Create Credentials" > "Service Account"**
3. Заполните форму:
   - **Service account name:** `upload-images-drive`
   - **Service account ID:** автоматически заполнится
   - **Description:** `Service account for uploading images to Google Drive`
4. Нажмите **"Create and Continue"**
5. Пропустите шаги 2 и 3 (роли и доступ), нажмите **"Done"**

### 4. Скачивание JSON-ключа

1. В списке Service Accounts найдите созданный аккаунт
2. Нажмите на email аккаунта
3. Перейдите на вкладку **"Keys"**
4. Нажмите **"Add Key" > "Create new key"**
5. Выберите **"JSON"** и нажмите **"Create"**
6. Файл автоматически скачается
7. Переименуйте файл в `credentials.json` и поместите в корень проекта

### 5. Поиск ID папки Google Drive

1. Откройте Google Drive
2. Создайте новую папку или выберите существующую
3. Откройте папку
4. Скопируйте ID из URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID
   ```
   Например: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 6. Предоставление доступа к папке

1. Откройте папку в Google Drive
2. Нажмите правой кнопкой мыши на папку
3. Выберите **"Share"** (Поделиться)
4. В поле "Add people and groups" введите email сервисного аккаунта
   - Email можно найти в файле `credentials.json` в поле `client_email`
5. Установите права доступа: **"Editor"**
6. Снимите галочку **"Notify people"**
7. Нажмите **"Share"**

### 7. Настройка переменных окружения

1. Скопируйте файл примера:
   ```bash
   cp env.example .env
   ```

2. Отредактируйте `.env` файл:
   ```env
   PORT=3000
   FOLDER_ID=ваш_id_папки_здесь
   ```

### 8. Запуск проекта

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите сервер:
   ```bash
   npm start
   ```

3. Откройте браузер и перейдите по адресу:
   ```
   http://localhost:3000
   ```

## 📁 Структура проекта

```
send-photo-drive/
├── package.json          # Зависимости проекта
├── server.js             # Основной сервер
├── index.html            # Веб-интерфейс
├── credentials.json      # Ключ Service Account (не в репозитории)
├── .env                  # Переменные окружения (не в репозитории)
├── env.example           # Пример переменных окружения
├── uploads/              # Временная папка для загрузок (создается автоматически)
└── README.md             # Документация
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт для запуска сервера | `3000` |
| `FOLDER_ID` | ID папки в Google Drive | - |

### Ограничения

- **Размер файла:** максимум 10MB
- **Типы файлов:** только изображения (JPG, PNG, GIF, WebP)
- **Количество файлов:** один за раз

## 🛠️ Технологии

- **Backend:** Node.js, Express.js
- **File Upload:** Multer
- **Google Drive API:** googleapis
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Environment:** dotenv

## 🔍 Устранение неполадок

### Ошибка: "Файл credentials.json не найден"
- Убедитесь, что файл `credentials.json` находится в корне проекта
- Проверьте, что файл не поврежден

### Ошибка: "Не удалось получить доступ к папке"
- Проверьте, что сервисный аккаунт имеет права доступа к папке
- Убедитесь, что ID папки указан правильно в `.env`

### Ошибка: "Google Drive API не включен"
- Перейдите в Google Cloud Console
- Включите Google Drive API для проекта

### Ошибка: "Размер файла превышает 10MB"
- Уменьшите размер изображения перед загрузкой
- Используйте сжатие изображений

## 📝 API Endpoints

### GET /
Возвращает главную страницу с формой загрузки.

### POST /upload
Загружает изображение в Google Drive.

**Параметры:**
- `image` (multipart/form-data): файл изображения

**Ответ (успех):**
```json
{
  "success": true,
  "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "fileName": "image.jpg",
  "webViewLink": "https://drive.google.com/file/d/...",
  "message": "Файл успешно загружен в Google Drive"
}
```

**Ответ (ошибка):**
```json
{
  "error": "Описание ошибки"
}
```

## 🔒 Безопасность

- Файл `credentials.json` содержит приватные ключи - не публикуйте его
- Добавьте `credentials.json` и `.env` в `.gitignore`
- Используйте HTTPS в продакшене
- Ограничьте доступ к папке Google Drive только необходимыми пользователями

## 📄 Лицензия

MIT License
