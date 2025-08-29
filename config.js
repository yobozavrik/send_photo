const dotenv = require('dotenv');

const result = dotenv.config();
if (result.error) {
    throw new Error('Не найден файл .env');
}

const { FOLDER_ID, PORT } = process.env;

if (!FOLDER_ID) {
    throw new Error('Отсутствует обязательная переменная окружения FOLDER_ID');
}

if (!PORT) {
    throw new Error('Отсутствует обязательная переменная окружения PORT');
}

const parsedPort = Number(PORT);
if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error('Переменная PORT должна быть положительным числом');
}

module.exports = {
    FOLDER_ID,
    PORT: parsedPort,
};
