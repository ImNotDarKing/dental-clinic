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

app.use(cors({
	origin: config.corsOrigin,
	credentials: true,
}));
app.use(express.json());


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

	if (!token) {
		return res.status(401).json({ message: 'Токен отсутствует' });
	}

	jwt.verify(token, config.jwtSecret, (err, user) => {
		if (err) {
			return res.status(403).json({ message: 'Токен недействителен' });
		}
		req.user = user;
		next();
	});
};


const authenticateAdminToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'Токен отсутствует' });
	}

	jwt.verify(token, config.adminTokenSecret, (err, admin) => {
		if (err) {
			return res.status(403).json({ message: 'Токен недействителен' });
		}
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

		db.run(
			'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
			[email, passwordHash, parseInt(role, 10)],
			function (err) {
				if (err) {
					console.error('Ошибка при INSERT:', err);
					if (err.code === 'SQLITE_CONSTRAINT' || err.code === '23505') {
						return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
					}
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}

				const userId = this.lastID || this.lastID;

				if (parseInt(role, 10) === 1) {
					db.run(
						'INSERT INTO patients (user_id, first_name, last_name) VALUES (?, ?, ?)',
						[userId, '', ''],
						(err) => {
							if (err) console.error('Ошибка создания пациента:', err);
						}
					);
				} else {
					db.run(
						'INSERT INTO doctors (user_id, first_name, last_name, specialization, experience_years) VALUES (?, ?, ?, ?, ?)',
						[userId, '', '', '', 0],
						(err) => {
							if (err) console.error('Ошибка создания врача:', err);
						}
					);
				}

				res.json({ message: 'Регистрация успешна' });
			}
		);
	} catch (error) {
		console.error('Ошибка в /register:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.post('/login', (req, res) => {
	const db = getDB();
	const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res.status(400).json({ message: 'Email и пароль обязательны' });
		}

		db.get(
			'SELECT user_id AS id, email, password_hash, role_id FROM users WHERE email = ?',
			[email],
			async (err, user) => {
				if (err) {
					console.error('Ошибка при SELECT:', err);
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}

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
			}
		);
	} catch (error) {
		console.error('Ошибка в /login:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/profile', authenticateToken, (req, res) => {
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;

	try {
		const table = role === 1 ? 'patients' : 'doctors';
		const query = `SELECT * FROM ${table} WHERE user_id = ?`;

		db.get(query, [user_id], (err, profile) => {
			if (err) {
				console.error('Ошибка /profile:', err);
				return res.status(500).json({ message: 'Ошибка базы данных' });
			}
			res.json(profile || {});
		});
	} catch (error) {
		console.error('Ошибка в /profile:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.put('/profile', authenticateToken, (req, res) => {
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;
	const { first_name, last_name, phone_number, address, specialization, experience_years, photo_url } = req.body;

	try {
		if (role === 1) {
			db.run(
				'UPDATE patients SET first_name = ?, last_name = ?, phone_number = ?, address = ? WHERE user_id = ?',
				[first_name, last_name, phone_number, address, user_id],
				function (err) {
					if (err) {
						console.error('Ошибка обновления пациента:', err);
						return res.status(500).json({ message: 'Ошибка при обновлении профиля' });
					}
					res.json({ message: 'Профиль обновлён' });
				}
			);
		} else {
			db.run(
				'UPDATE doctors SET first_name = ?, last_name = ?, specialization = ?, experience_years = ?, photo_url = ? WHERE user_id = ?',
				[first_name, last_name, specialization, experience_years, photo_url, user_id],
				function (err) {
					if (err) {
						console.error('Ошибка обновления врача:', err);
						return res.status(500).json({ message: 'Ошибка при обновлении профиля' });
					}
					res.json({ message: 'Профиль обновлён' });
				}
			);
		}
	} catch (error) {
		console.error('Ошибка в PUT /profile:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.post('/appointment', authenticateToken, async (req, res) => {
	const db = getDB();
	const { doctor_id, appointment_date, service_type } = req.body;
	const user_id = req.user.id;

	try {
		if (!doctor_id || !appointment_date || !service_type) {
			return res.status(400).json({ message: 'Все поля обязательны' });
		}

		db.get(
			'SELECT patient_id FROM patients WHERE user_id = ?',
			[user_id],
			(err, patient) => {
				if (err) {
					console.error('Ошибка при SELECT patients:', err);
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}

				if (!patient) {
					return res.status(404).json({ message: 'Профиль пациента не найден' });
				}

				db.run(
					'INSERT INTO appointments (patient_id, doctor_id, appointment_date, service_type) VALUES (?, ?, ?, ?)',
					[patient.patient_id, doctor_id, appointment_date, service_type],
					function (err) {
						if (err) {
							console.error('Ошибка при INSERT appointment:', err);
							return res.status(500).json({ message: 'Ошибка при создании записи' });
						}

						res.json({ message: 'Запись успешно создана', appointment_id: this.lastID });
					}
				);
			}
		);
	} catch (error) {
		console.error('Ошибка в /appointment:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/appointments', authenticateToken, (req, res) => {
	const db = getDB();
	const user_id = req.user.id;
	const role = req.user.role;

	try {
		if (role === 1) {
			db.all(
				`SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
				 FROM appointments a
				 JOIN patients p ON a.patient_id = p.patient_id
				 JOIN doctors d ON a.doctor_id = d.doctor_id
				 WHERE p.user_id = ?`,
				[user_id],
				(err, appointments) => {
					if (err) {
						console.error('Ошибка /appointments (пациент):', err);
						return res.status(500).json({ message: 'Ошибка' });
					}
					res.json((appointments || []).map((a) => ({
						...a,
						doctor_name: `${a.doctor_first_name} ${a.doctor_last_name}`,
					})));
				}
			);
		} else {
			db.all(
				`SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name
				 FROM appointments a
				 JOIN doctors doc ON a.doctor_id = doc.doctor_id
				 JOIN patients p ON a.patient_id = p.patient_id
				 WHERE doc.user_id = ?`,
				[user_id],
				(err, appointments) => {
					if (err) {
						console.error('Ошибка /appointments (врач):', err);
						return res.status(500).json({ message: 'Ошибка' });
					}
					res.json((appointments || []).map((a) => ({
						...a,
						patient_name: `${a.patient_first_name} ${a.patient_last_name}`,
					})));
				}
			);
		}
	} catch (error) {
		console.error('Ошибка в GET /appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/appointment/:id', authenticateToken, (req, res) => {
	const db = getDB();
	const appointmentId = req.params.id;
	const user_id = req.user.id;

	try {
		db.run(
			`DELETE FROM appointments
			 WHERE appointment_id = ?
			   AND patient_id IN (SELECT patient_id FROM patients WHERE user_id = ?)`,
			[appointmentId, user_id],
			function (err) {
				if (err) {
					console.error('Ошибка удаления записи:', err);
					return res.status(500).json({ message: 'Ошибка' });
				}
				if (this.changes === 0) {
					return res.status(403).json({ message: 'Нет доступа' });
				}
				res.json({ message: 'Удалено' });
			}
		);
	} catch (error) {
		console.error('Ошибка в DELETE /appointment:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/doctors', (req, res) => {
	const db = getDB();

	try {
		db.all('SELECT * FROM doctors', [], (err, doctors) => {
			if (err) {
				console.error('Ошибка /doctors:', err);
				return res.status(500).json({ message: 'Ошибка базы данных' });
			}
			res.json(doctors || []);
		});
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
	const db = getDB();

	try {
		db.all(
			`SELECT d.*, u.email FROM doctors d 
			 LEFT JOIN users u ON d.user_id = u.user_id`,
			[],
			(err, doctors) => {
				if (err) {
					console.error('Ошибка получения врачей:', err);
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}
				res.json(doctors || []);
			}
		);
	} catch (error) {
		console.error('Ошибка в GET /admin/doctors:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/admin/users', authenticateAdminToken, (req, res) => {
	const db = getDB();

	try {
		db.all('SELECT * FROM users', [], (err, users) => {
			if (err) {
				console.error('Ошибка получения пользователей:', err);
				return res.status(500).json({ message: 'Ошибка базы данных' });
			}
			res.json(users || []);
		});
	} catch (error) {
		console.error('Ошибка в GET /admin/users:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.get('/admin/appointments', authenticateAdminToken, (req, res) => {
	const db = getDB();

	try {
		db.all(
			`SELECT a.*, 
					p.first_name || ' ' || p.last_name as patient_name,
					d.first_name || ' ' || d.last_name as doctor_name
			 FROM appointments a
			 LEFT JOIN patients p ON p.patient_id = a.patient_id
			 LEFT JOIN doctors d ON d.doctor_id = a.doctor_id`,
			[],
			(err, appointments) => {
				if (err) {
					console.error('Ошибка получения записей:', err);
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}
				res.json(appointments || []);
			}
		);
	} catch (error) {
		console.error('Ошибка в GET /admin/appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/doctors/:id', authenticateAdminToken, (req, res) => {
	const db = getDB();
	const doctorId = req.params.id;

	try {
		db.run(`DELETE FROM doctors WHERE doctor_id = ?`, [doctorId], function (err) {
			if (err) {
				console.error('Ошибка удаления врача:', err);
				return res.status(500).json({ message: 'Ошибка базы данных' });
			}
			if (this.changes === 0) {
				return res.status(404).json({ message: 'Врач не найден' });
			}
			res.json({ message: 'Врач удалён' });
		});
	} catch (error) {
		console.error('Ошибка в DELETE /admin/doctors:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/users/:id', authenticateAdminToken, (req, res) => {
	const db = getDB();
	const userId = req.params.id;

	try {
		db.run(`DELETE FROM users WHERE user_id = ?`, [userId], function (err) {
			if (err) {
				console.error('Ошибка удаления пользователя:', err);
				return res.status(500).json({ message: 'Ошибка базы данных' });
			}
			if (this.changes === 0) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}
			res.json({ message: 'Пользователь удалён' });
		});
	} catch (error) {
		console.error('Ошибка в DELETE /admin/users:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


app.delete('/admin/appointments/:id', authenticateAdminToken, (req, res) => {
	const db = getDB();
	const appointmentId = req.params.id;

	try {
		db.run(
			`DELETE FROM appointments WHERE appointment_id = ?`,
			[appointmentId],
			function (err) {
				if (err) {
					console.error('Ошибка удаления записи:', err);
					return res.status(500).json({ message: 'Ошибка базы данных' });
				}
				if (this.changes === 0) {
					return res.status(404).json({ message: 'Запись не найдена' });
				}
				res.json({ message: 'Запись удалена' });
			}
		);
	} catch (error) {
		console.error('Ошибка в DELETE /admin/appointments:', error);
		res.status(500).json({ message: 'Ошибка сервера' });
	}
});


// Serve React app (both production and development)
const buildPath = path.join(__dirname, '../build');
console.log('Checking for React build at:', buildPath);
console.log('Build folder exists:', fs.existsSync(buildPath));

// Serve static files from build directory
app.use(express.static(buildPath));

// Catch all other routes and serve index.html for React Router (must be last)
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
