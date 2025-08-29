const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { PORT, FOLDER_ID } = require('./config');

const app = express();

// Настройка multer для обработки загруженных файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Создаем временную папку, если её нет
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Сохраняем оригинальное имя файла с временной меткой
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
    // Проверяем, что файл является изображением
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только изображения!'), false);
    }
};

// Настройка multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Максимум 10MB
        files: 1 // Только один файл за раз
    }
});

// Инициализация Google Drive API
let drive;

async function initializeGoogleDrive() {
    try {
        // Проверяем наличие файла с учетными данными
        const credentialsPath = path.join(__dirname, 'credentials.json');
        if (!fs.existsSync(credentialsPath)) {
            throw new Error('Файл credentials.json не найден! Создайте Service Account и скачайте JSON-ключ.');
        }

        // Загружаем учетные данные
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        // Создаем JWT клиент для аутентификации
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/drive.file']
        );

        // Создаем экземпляр Google Drive API
        drive = google.drive({ version: 'v3', auth });

        // Проверяем подключение
        await auth.authorize();
        console.log('✅ Google Drive API успешно инициализирован');
        
        // Проверяем доступ к папке
        try {
            await drive.files.get({ fileId: FOLDER_ID });
            console.log('✅ Доступ к папке Google Drive подтвержден');
        } catch (error) {
            console.warn('⚠️  Не удалось получить доступ к папке. Убедитесь, что сервисный аккаунт имеет права доступа.');
        }

    } catch (error) {
        console.error('❌ Ошибка инициализации Google Drive API:', error.message);
        process.exit(1);
    }
}

// Функция для загрузки файла в Google Drive
async function uploadToGoogleDrive(filePath, originalName) {
    try {
        const fileMetadata = {
            name: originalName, // Сохраняем оригинальное имя файла
            parents: FOLDER_ID ? [FOLDER_ID] : undefined
        };

        const media = {
            mimeType: 'image/*',
            body: fs.createReadStream(filePath)
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id,name,webViewLink'
        });

        return {
            fileId: response.data.id,
            fileName: response.data.name,
            webViewLink: response.data.webViewLink
        };

    } catch (error) {
        console.error('Ошибка загрузки в Google Drive:', error);
        throw new Error(`Не удалось загрузить файл в Google Drive: ${error.message}`);
    }
}

// Функция для очистки временных файлов
function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Временный файл удален:', filePath);
        }
    } catch (error) {
        console.error('Ошибка при удалении временного файла:', error);
    }
}

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршрут для загрузки файлов
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // Проверяем, что файл был загружен
        if (!req.file) {
            return res.status(400).json({ 
                error: 'Файл не был загружен' 
            });
        }

        console.log('📁 Получен файл:', req.file.originalname);

        // Загружаем файл в Google Drive
        const uploadResult = await uploadToGoogleDrive(
            req.file.path, 
            req.file.originalname
        );

        // Удаляем временный файл
        cleanupTempFile(req.file.path);

        console.log('✅ Файл успешно загружен в Google Drive:', uploadResult.fileName);

        // Отправляем успешный ответ
        res.json({
            success: true,
            fileId: uploadResult.fileId,
            fileName: uploadResult.fileName,
            webViewLink: uploadResult.webViewLink,
            message: 'Файл успешно загружен в Google Drive'
        });

    } catch (error) {
        console.error('❌ Ошибка при обработке загрузки:', error);

        // Удаляем временный файл в случае ошибки
        if (req.file) {
            cleanupTempFile(req.file.path);
        }

        res.status(500).json({
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'Размер файла превышает 10MB' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Можно загрузить только один файл за раз' 
            });
        }
        return res.status(400).json({ 
            error: 'Ошибка загрузки файла' 
        });
    }

    if (error.message === 'Разрешены только изображения!') {
        return res.status(400).json({ 
            error: 'Разрешены только изображения' 
        });
    }

    next(error);
});

// Обработка 404 ошибок
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Страница не найдена' 
    });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
    console.error('❌ Необработанная ошибка:', error);
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера' 
    });
});

// Запуск сервера
async function startServer() {
    try {
        // Инициализируем Google Drive API
        await initializeGoogleDrive();

        // Запускаем сервер
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`📱 Откройте http://localhost:${PORT} в браузере`);
            console.log('📁 Папка для загрузки:', FOLDER_ID);
        });

    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
    console.log('\n🛑 Сервер остановлен');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Сервер остановлен');
    process.exit(0);
});

// Запускаем сервер
startServer();
