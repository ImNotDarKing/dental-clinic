require('dotenv').config();

const config = require('./src/config');
const { initDatabase } = require('./src/db');
const app = require('./src/server-core');

async function start() {
	try {
		console.log(`Инициализиация БД (тип: ${config.dbType})...`);
		await initDatabase();

		const PORT = config.port;
		app.listen(PORT, () => {
			console.log(`\nСервер запущен на порту ${PORT}`);
			console.log(`URL: http://localhost:${PORT}`);
			console.log(`CORS origin: ${config.corsOrigin}`);
			console.log(`Database: ${config.dbType.toUpperCase()} (${config.dbPath})`);
			console.log(`Environment: ${config.nodeEnv}\n`);
		});
	} catch (error) {
		console.error('Ошибка при запуске сервера:', error);
		process.exit(1);
	}
}

start();

process.on('SIGTERM', () => {
	console.log('SIGTERM сигнал получен: закрытие HTTP сервера');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('SIGINT сигнал получен: закрытие HTTP сервера');
	process.exit(0);
});

