const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

let db = null;

async function initDatabase() {
	return initSQLite();
}

function initSQLite() {
	try {
		const dbPath = path.resolve(config.dbPath);
		db = new Database(dbPath);
		console.log(`SQLite БД открыта: ${dbPath}`);
		createTablesIfNotExist();
		return db;
	} catch (err) {
		console.error('Ошибка открытия SQLite:', err.message);
		throw err;
	}
}


function createTablesIfNotExist() {
	const tables = [
		`CREATE TABLE IF NOT EXISTS users (
			user_id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role_id INTEGER NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS patients (
			patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			first_name TEXT,
			last_name TEXT,
			phone_number TEXT,
			address TEXT,
			FOREIGN KEY(user_id) REFERENCES users(user_id)
		)`,

		`CREATE TABLE IF NOT EXISTS doctors (
			doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			first_name TEXT,
			last_name TEXT,
			specialization TEXT,
			experience_years INTEGER,
			photo_url TEXT,
			FOREIGN KEY(user_id) REFERENCES users(user_id)
		)`,

		`CREATE TABLE IF NOT EXISTS appointments (
			appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
			patient_id INTEGER,
			doctor_id INTEGER,
			appointment_date DATETIME NOT NULL,
			service_type TEXT NOT NULL,
			FOREIGN KEY(patient_id) REFERENCES patients(patient_id),
			FOREIGN KEY(doctor_id) REFERENCES doctors(doctor_id)
		)`,
	];

	tables.forEach((query) => {
		try {
			db.exec(query);
			console.log('Таблица готова');
		} catch (err) {
			console.error('Ошибка создания таблицы:', err.message);
		}
	});
}

function getDB() {
	if (!db) {
		throw new Error('БД не инициализирована. Вызвать initDatabase() перед использованием.');
	}
	return db;
}

module.exports = {
	initDatabase,
	getDB,
};
