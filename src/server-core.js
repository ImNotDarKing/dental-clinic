const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { getDB } = require('./db');

const app = express();

const allowedOrigins = [
	config.corsOrigin,
	'http://localhost:3000',
	'http://localhost:5000',
	'http://127.0.0.1:3000',
	'http://127.0.0.1:5000'
];

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		
		if (allowedOrigins.includes(origin) || 
			(config.nodeEnv === 'production' && origin.includes('railway.app')) ||
			(config.nodeEnv === 'production' && origin.includes('onrender.com'))) {
			callback(null, true);
		} else {
			console.log('CORS блокирован для:', origin);
			callback(null, true); 
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use((req, res, next) => {
	if (req.path === '/profile' || req.path.startsWith('/profile')) {
		console.log(`\nINCOMING REQUEST TO ${req.path}`);
		console.log(`Method: ${req.method}`);
		console.log(`URL: ${req.url}`);
		console.log(`Authorization header: ${req.headers['authorization'] ? 'Present' : 'Missing'}`);
		console.log(`User-Agent: ${req.get('User-Agent')}`);
		console.log(`Referer: ${req.get('Referer')}`);
	}
	next();
});

app.use('/img', express.static(path.join(__dirname, '../img')));


let upload;
if (config.storageType === 'disk') {
	const uploadDir = path.join(__dirname, '../img/dantist');
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}

	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, uploadDir);
		},
		filename: (req, file, cb) => {
			cb(null, Date.now() + path.extname(file.originalname));
		},
	});

	upload = multer({
		storage: storage,
		limits: { fileSize: config.maxFileSize },
		fileFilter: (req, file, cb) => {
			if (!file.mimetype.startsWith('image/')) {
				cb(new Error('Только изображения разрешены'));
			} else {
				cb(null, true);
			}
		},
	});
} else {
	upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: config.maxFileSize },
		fileFilter: (req, file, cb) => {
			if (!file.mimetype.startsWith('image/')) {
				cb(new Error('Только изображения разрешены'));
			} else {
				cb(null, true);
			}
		},
	});
}

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	
	const acceptHeader = req.get('Accept') || '';
	const isBrowserNavigationRequest = acceptHeader.includes('text/html') && 
		(req.get('sec-fetch-dest') === 'document' || req.get('sec-fetch-mode') === 'navigate');

	console.log('=== DEBUG authenticateToken ===');
	console.log('Method:', req.method);
	console.log('URL:', req.url);
	console.log('Path:', req.path);
	console.log('sec-fetch-dest:', req.get('sec-fetch-dest'));
	console.log('sec-fetch-mode:', req.get('sec-fetch-mode'));
	console.log('Is browser navigation:', isBrowserNavigationRequest);
	console.log('authHeader:', authHeader ? 'Present' : 'Missing');
	console.log('token:', token ? 'Present' : 'Missing');
	console.log('================================');

	if (isBrowserNavigationRequest && !token) {
		console.log('Browser navigation detected without token - serving React app (index.html)');
		const buildPath = path.join(__dirname, '../build');
		const indexPath = path.join(buildPath, 'index.html');
		return res.sendFile(indexPath, (err) => {
			if (err) {
				console.error('Error serving index.html:', err);
				return res.status(500).json({ message: 'Error serving app' });
			}
		});
	}

	if (!token) {
		console.error(`No token found in Authorization header for ${req.method} ${req.path}`);
		console.error('Request came from:', req.get('User-Agent'));
		return res.status(401).json({ message: 'Токен отсутствует' });
	}

	jwt.verify(token, config.jwtSecret, (err, user) => {
		if (err) {
			console.error('Token verification failed:', err.message);
			return res.status(403).json({ message: 'Токен недействителен' });
		}
		console.log('Token verified for user:', user);
		req.user = user;
		next();
	});
};


const authenticateAdminToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	console.log('=== DEBUG authenticateAdminToken ===');
	console.log('Method:', req.method);
	console.log('URL:', req.url);
	console.log('authHeader:', authHeader ? 'Present' : 'Missing');
	console.log('token:', token ? 'Present' : 'Missing');
	console.log('====================================');

	if (!token) {
		console.error(`No admin token found for ${req.method} ${req.path}`);
		return res.status(401).json({ message: 'Токен отсутствует' });
	}

	jwt.verify(token, config.adminTokenSecret, (err, admin) => {
		if (err) {
			console.error(`Admin token verification failed:`, err.message);
			return res.status(403).json({ message: 'Токен недействителен' });
		}
		console.log('Admin token verified');
		req.admin = admin;
		next();
	});
};


app.post('/upload-photo', authenticateToken, upload.single('photo'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: 'Файл не загружен' });
		}

		const photoUrl = `/img/dantist/${req.file.filename}`;
		res.json({ photo_url: photoUrl });
	} catch (error) {
		console.error('Ошибка загрузки фото:', error);
		res.status(500).json({ message: 'Ошибка загрузки файла' });
	}
});


app.post('/register', async (req, res) => {
	const db = getDB();
	const { email, password, role } = req.body;

	try {
		if (!email || !password || !role) {
			return res.status(400).json({ message: 'Все поля обязательны' });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		try {
			const stmt = db.prepare('INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)');
			const info = stmt.run(email, passwordHash, parseInt(role, 10));
			const userId = info.lastInsertRowid;

			if (parseInt(role, 10) === 1) {
				db.prepare('INSERT INTO patients (user_id, first_name, last_name) VALUES (?, ?, ?)')
					.run(userId, '', '');
			} else {
				db.prepare('INSERT INTO doctors (user_id, first_name, last_name, specialization, experience_years) VALUES (?, ?, ?, ?, ?)')
					.run(userId, '', '', '', 0);
			}

			res.json({ message: 'Регистрация успешна' });
		} catch (dbErr) {
			console.error('Ошибка при INSERT:', dbErr);
			if (dbErr.message.includes('UNIQUE constraint failed')) {
				return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
			}
			return res.status(500).json({ message: 'Ошибка базы данных' });
		}
	} catch (error) {
		console.error('Ошибка в /register:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.post('/login', async (req, res) => {
	const db = getDB();
	const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res.status(400).json({ message: 'Email и пароль обязательны' });
		}

		const user = db.prepare('SELECT user_id AS id, email, password_hash, role_id FROM users WHERE email = ?').get(email);

		if (!user) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		try {
			const valid = await bcrypt.compare(password, user.password_hash);

			if (!valid) {
				return res.status(401).json({ message: 'Неверный пароль' });
			}

			const token = jwt.sign(
				{ id: user.id, email: user.email, role: user.role_id },
				config.jwtSecret,
				{ expiresIn: '1h' }
			);

			res.json({
				message: 'Вход выполнен успешно',
				token,
				user: { id: user.id, email: user.email, role: user.role_id },
			});
		} catch (error) {
			console.error('Ошибка в bcrypt.compare:', error);
			res.status(500).json({ message: 'Ошибка сервера' });
		}
	} catch (error) {
		console.error('Ошибка в /login:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/profile', authenticateToken, (req, res) => {
	console.log(`Handling GET /profile for user ${req.user.id}`);
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;

	try {
		const table = role === 1 ? 'patients' : 'doctors';
		const query = `SELECT * FROM ${table} WHERE user_id = ?`;
		const profile = db.prepare(query).get(user_id);
		res.json(profile || {});
	} catch (error) {
		console.error('Ошибка в /profile:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.put('/profile', authenticateToken, (req, res) => {
	console.log(`Handling PUT /profile for user ${req.user.id}`);
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;
	const { first_name, last_name, phone_number, address, specialization, experience_years, photo_url } = req.body;

	try {
		if (role === 1) {
			const info = db.prepare(
				'UPDATE patients SET first_name = ?, last_name = ?, phone_number = ?, address = ? WHERE user_id = ?'
			).run(first_name, last_name, phone_number, address, user_id);
			
			if (info.changes === 0) {
				return res.status(404).json({ message: 'Профиль не найден' });
			}
		} else {
			const info = db.prepare(
				'UPDATE doctors SET first_name = ?, last_name = ?, specialization = ?, experience_years = ?, photo_url = ? WHERE user_id = ?'
			).run(first_name, last_name, specialization, experience_years, photo_url, user_id);
			
			if (info.changes === 0) {
				return res.status(404).json({ message: 'Профиль не найден' });
			}
		}
		
		res.json({ message: 'Профиль обновлён' });
	} catch (error) {
		console.error('Ошибка в PUT /profile:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.post('/appointment', authenticateToken, async (req, res) => {
	console.log(`Handling POST /appointment for user ${req.user.id}`);
	const db = getDB();
	const { doctor_id, appointment_date, service_type } = req.body;
	const user_id = req.user.id;

	try {
		if (!doctor_id || !appointment_date || !service_type) {
			return res.status(400).json({ message: 'Все поля обязательны' });
		}

		const patient = db.prepare('SELECT patient_id FROM patients WHERE user_id = ?').get(user_id);

		if (!patient) {
			return res.status(404).json({ message: 'Профиль пациента не найден' });
		}

		const info = db.prepare(
			'INSERT INTO appointments (patient_id, doctor_id, appointment_date, service_type) VALUES (?, ?, ?, ?)'
		).run(patient.patient_id, doctor_id, appointment_date, service_type);

		res.json({ message: 'Запись успешно создана', appointment_id: info.lastInsertRowid });
	} catch (error) {
		console.error('Ошибка в /appointment:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/appointments', authenticateToken, (req, res) => {
	console.log(`Handling GET /appointments for user ${req.user.id}`);
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;

	try {
		if (role === 1) {
			const appointments = db.prepare(`
				SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
				FROM appointments a
				JOIN patients p ON a.patient_id = p.patient_id
				JOIN doctors d ON a.doctor_id = d.doctor_id
				WHERE p.user_id = ?
			`).all(user_id);
			
			res.json(appointments.map((a) => ({
				...a,
				doctor_name: `${a.doctor_first_name} ${a.doctor_last_name}`,
			})));
		} else {
			const appointments = db.prepare(`
				SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name
				FROM appointments a
				JOIN doctors doc ON a.doctor_id = doc.doctor_id
				JOIN patients p ON a.patient_id = p.patient_id
				WHERE doc.user_id = ?
			`).all(user_id);
			
			res.json(appointments.map((a) => ({
				...a,
				patient_name: `${a.patient_first_name} ${a.patient_last_name}`,
			})));
		}
	} catch (error) {
		console.error('Ошибка в GET /appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/appointment/:id', authenticateToken, (req, res) => {	console.log(`Handling DELETE /appointment/${req.params.id} for user ${req.user.id}`);	const db = getDB();
	const appointmentId = req.params.id;
	const user_id = req.user.id;

	try {
		const info = db.prepare(`
			DELETE FROM appointments
			WHERE appointment_id = ?
			  AND patient_id IN (SELECT patient_id FROM patients WHERE user_id = ?)
		`).run(appointmentId, user_id);

		if (info.changes === 0) {
			return res.status(403).json({ message: 'Нет доступа' });
		}
		res.json({ message: 'Удалено' });
	} catch (error) {
		console.error('Ошибка в DELETE /appointment:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/doctors', (req, res) => {
	const db = getDB();

	try {
		const doctors = db.prepare('SELECT * FROM doctors').all();
		res.json(doctors || []);
	} catch (error) {
		console.error('Ошибка в GET /doctors:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.post('/admin/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		if (email !== config.adminEmail || password !== config.adminPassword) {
			return res.status(401).json({ message: 'Неверный логин или пароль' });
		}

		const token = jwt.sign({ email: config.adminEmail }, config.adminTokenSecret, {
			expiresIn: '24h',
		});
		res.json({ token });
	} catch (error) {
		console.error('Ошибка в /admin/login:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/admin/doctors', authenticateAdminToken, (req, res) => {
	console.log('Handling GET /admin/doctors');
	const db = getDB();

	try {
		const doctors = db.prepare(`
			SELECT d.*, u.email FROM doctors d 
			LEFT JOIN users u ON d.user_id = u.user_id
		`).all();
		res.json(doctors || []);
	} catch (error) {
		console.error('Ошибка в GET /admin/doctors:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/admin/users', authenticateAdminToken, (req, res) => {
	console.log('Handling GET /admin/users');
	const db = getDB();

	try {
		const users = db.prepare('SELECT * FROM users').all();
		res.json(users || []);
	} catch (error) {
		console.error('Ошибка в GET /admin/users:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/admin/appointments', authenticateAdminToken, (req, res) => {
	console.log('Handling GET /admin/appointments');
	const db = getDB();

	try {
		const appointments = db.prepare(`
			SELECT a.*, 
					p.first_name || ' ' || p.last_name as patient_name,
					d.first_name || ' ' || d.last_name as doctor_name
			FROM appointments a
			LEFT JOIN patients p ON p.patient_id = a.patient_id
			LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
		`).all();
		res.json(appointments || []);
	} catch (error) {
		console.error('Ошибка в GET /admin/appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/doctors/:id', authenticateAdminToken, (req, res) => {
	console.log(`Handling DELETE /admin/doctors/${req.params.id}`);
	const db = getDB();
	const doctorId = req.params.id;

	try {
		const info = db.prepare('DELETE FROM doctors WHERE doctor_id = ?').run(doctorId);
		
		if (info.changes === 0) {
			return res.status(404).json({ message: 'Врач не найден' });
		}
		res.json({ message: 'Врач удалён' });
	} catch (error) {
		console.error('Ошибка в DELETE /admin/doctors:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/users/:id', authenticateAdminToken, (req, res) => {
	console.log(`Handling DELETE /admin/users/${req.params.id}`);
	const db = getDB();
	const userId = req.params.id;

	try {
		const info = db.prepare('DELETE FROM users WHERE user_id = ?').run(userId);
		
		if (info.changes === 0) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}
		res.json({ message: 'Пользователь удалён' });
	} catch (error) {
		console.error('Ошибка в DELETE /admin/users:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/appointments/:id', authenticateAdminToken, (req, res) => {
	console.log(`Handling DELETE /admin/appointments/${req.params.id}`);
	const db = getDB();
	const appointmentId = req.params.id;

	try {
		const info = db.prepare('DELETE FROM appointments WHERE appointment_id = ?').run(appointmentId);
		
		if (info.changes === 0) {
			return res.status(404).json({ message: 'Запись не найдена' });
		}
		res.json({ message: 'Запись удалена' });
	} catch (error) {
		console.error('Ошибка в DELETE /admin/appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


const buildPath = path.join(__dirname, '../build');
console.log('Checking for React build at:', buildPath);
console.log('Build folder exists:', fs.existsSync(buildPath));

app.use(express.static(buildPath));

app.use((req, res) => {
	const indexPath = path.join(buildPath, 'index.html');
	res.sendFile(indexPath, (err) => {
		if (err) {
			console.error('Error serving index.html:', err);
			res.status(404).json({ message: 'Page not found' });
		}
	});
});

app.use((err, req, res, next) => {
	console.error('Необработанная ошибка:', err);
	res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;
