const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/img', express.static(path.join(__dirname, '../../img')));

const JWT_SECRET = "your_secret_key";

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Токен недействителен' });
        req.user = user;
        next();
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../img/dantist/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Только изображения разрешены'));
        } else {
            cb(null, true);
        }
    }
});

app.post("/upload-photo", authenticateToken, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Файл не загружен" });
    }

    const photoUrl = `/img/dantist/${req.file.filename}`;
    res.json({ photo_url: photoUrl });
});

const dbPath = path.join(__dirname, "dentalClinicDB.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Ошибка открытия базы данных:", err.message);
        process.exit(1);
    }
    console.log("База данных открыта:", dbPath);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role_id INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Ошибка создания таблицы users:", err.message);
        } else {
            console.log("Таблица users готова");
        }
    });
 
    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            address TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    `, (err) => {
        if (err) {
            console.error("Ошибка создания таблицы patients:", err.message);
        } else {
            console.log("Таблица patients готова");
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT,
            last_name TEXT,
            specialization TEXT,
            experience_years INTEGER,
            photo_url TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    `, (err) => {
        if (err) {
            console.error("Ошибка создания таблицы doctors:", err.message);
        } else {
            console.log("Таблица doctors готова");
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            doctor_id INTEGER,
            appointment_date DATETIME NOT NULL,
            service_type TEXT NOT NULL,
            FOREIGN KEY(patient_id) REFERENCES patients(patient_id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(doctor_id)
        )
    `, (err) => {
        if (err) {
            console.error("Ошибка создания таблицы appointments:", err.message);
        } else {
            console.log("Таблица appointments готова");
        }
    });
});

app.post("/register", async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Все поля обязательны" });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
        INSERT INTO users (email, password_hash, role_id)
        VALUES (?, ?, ?)
        `;

        db.run(query, [email, passwordHash, parseInt(role, 10)], function (err) {
            if (err) {
                console.error("Ошибка при INSERT:", err);

                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ message: "Пользователь с таким email уже существует" });
                }
                return res.status(500).json({ message: "Ошибка базы данных", error: err.message });
            }

            const userId = this.lastID;

            if (parseInt(role, 10) === 1) {
                db.run(
                    `INSERT INTO patients (user_id, first_name, last_name) VALUES (?, ?, ?)`,
                    [userId, '', ''],
                    (err) => {
                        if (err) console.error("Ошибка создания пациента:", err);
                    }
                );
            } else {
                db.run(
                    `INSERT INTO doctors (user_id, first_name, last_name, specialization, experience_years) VALUES (?, ?, ?, ?, ?)`,
                    [userId, '', '', '', 0],
                    (err) => {
                        if (err) console.error("Ошибка создания врача:", err);
                    }
                );
            }

            res.json({ message: "Регистрация успешна" });
        });
    } catch (error) {
        console.error("Ошибка в /register:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email и пароль обязательны" });
    }

    db.get(
        "SELECT user_id AS id, email, password_hash, role_id FROM users WHERE email = ?",
        [email],
        async (err, user) => {
            if (err) {
                console.error("Ошибка при SELECT:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }

            if (!user) {
                return res.status(404).json({ message: "Пользователь не найден" });
            }

            try {
                const valid = await bcrypt.compare(password, user.password_hash);

                if (!valid) {
                    return res.status(401).json({ message: "Неверный пароль" });
                }

                const token = jwt.sign({ id: user.id, email: user.email, role: user.role_id }, JWT_SECRET, { expiresIn: '1h' });

                res.json({ message: "Вход выполнен успешно", token, user: { id: user.id, email: user.email, role: user.role_id } });
            } catch (error) {
                console.error("Ошибка в bcrypt.compare:", error);
                res.status(500).json({ message: "Ошибка сервера" });
            }
        }
    );
});

app.post("/appointment", authenticateToken, async (req, res) => {
    const { doctor_id, appointment_date, service_type } = req.body;
    const user_id = req.user.id;

    if (!doctor_id || !appointment_date || !service_type) {
        return res.status(400).json({ message: "Все поля обязательны" });
    }

    try {
        db.get(
            "SELECT patient_id FROM patients WHERE user_id = ?",
            [user_id],
            (err, patient) => {
                if (err) {
                    console.error("Ошибка при SELECT patients:", err);
                    return res.status(500).json({ message: "Ошибка базы данных" });
                }

                if (!patient) {
                    return res.status(404).json({ message: "Профиль пациента не найден" });
                }

                db.run(
                    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, service_type)
                     VALUES (?, ?, ?, ?)`,
                    [patient.patient_id, doctor_id, appointment_date, service_type],
                    function (err) {
                        if (err) {
                            console.error("Ошибка при INSERT appointment:", err);
                            return res.status(500).json({ message: "Ошибка при создании записи" });
                        }

                        res.json({ message: "Запись успешно создана", appointment_id: this.lastID });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Ошибка в /appointment:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

app.get("/profile", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const role = req.user.role;

    const table = role === 1 ? "patients" : "doctors";
    const query = `SELECT * FROM ${table} WHERE user_id = ?`;

    db.get(query, [user_id], (err, profile) => {
        if (err) {
            console.error("Ошибка /profile:", err);
            return res.status(500).json({ message: "Ошибка базы данных" });
        }
        res.json(profile || {});
    });
});

app.put("/profile", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const role = req.user.role;
    const { first_name, last_name, phone_number, address, specialization, experience_years, photo_url } = req.body;

    if (role === 1) {
        db.run(
            `UPDATE patients SET first_name = ?, last_name = ?, phone_number = ?, address = ? WHERE user_id = ?`,
            [first_name, last_name, phone_number, address, user_id],
            function (err) {
                if (err) {
                    console.error("Ошибка обновления пациента:", err);
                    return res.status(500).json({ message: "Ошибка при обновлении профиля" });
                }
                res.json({ message: "Профиль обновлён" });
            }
        );
    } else {
        db.run(
            `UPDATE doctors SET first_name = ?, last_name = ?, specialization = ?, experience_years = ?, photo_url = ? WHERE user_id = ?`,
            [first_name, last_name, specialization, experience_years, photo_url, user_id],
            function (err) {
                if (err) {
                    console.error("Ошибка обновления врача:", err);
                    return res.status(500).json({ message: "Ошибка при обновлении профиля" });
                }
                res.json({ message: "Профиль обновлён" });
            }
        );
    }
});

app.get("/appointments", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const role = req.user.role;

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
                    console.error("Ошибка /appointments (пациент):", err);
                    return res.status(500).json({ message: "Ошибка" });
                }
                res.json((appointments || []).map(a => ({
                    ...a,
                    doctor_name: `${a.doctor_first_name} ${a.doctor_last_name}`
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
                    console.error("Ошибка /appointments (врач):", err);
                    return res.status(500).json({ message: "Ошибка" });
                }
                res.json((appointments || []).map(a => ({
                    ...a,
                    patient_name: `${a.patient_first_name} ${a.patient_last_name}`
                })));
            }
        );
    }
});

app.delete("/appointment/:id", authenticateToken, (req, res) => {
    const appointmentId = req.params.id;
    const user_id = req.user.id;

    db.run(
        `DELETE FROM appointments
         WHERE appointment_id = ?
           AND patient_id IN (SELECT patient_id FROM patients WHERE user_id = ?)`,
        [appointmentId, user_id],
        function (err) {
            if (err) {
                console.error("Ошибка удаления записи:", err);
                return res.status(500).json({ message: "Ошибка" });
            }
            if (this.changes === 0) return res.status(403).json({ message: "Нет доступа" });
            res.json({ message: "Удалено" });
        }
    );
});

app.get("/doctors", (req, res) => {
    db.all("SELECT * FROM doctors", [], (err, doctors) => {
        if (err) {
            console.error("Ошибка /doctors:", err);
            return res.status(500).json({ message: "Ошибка базы данных" });
        }
        res.json(doctors || []);
    });
});


// ===== АДМИН ПАНЕЛЬ =====

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "123456";
const ADMIN_TOKEN_SECRET = "admin_secret_key_very_secure";

const authenticateAdminToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

    jwt.verify(token, ADMIN_TOKEN_SECRET, (err, admin) => {
        if (err) return res.status(403).json({ message: 'Токен недействителен' });
        req.admin = admin;
        next();
    });
};

// Вход 
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    const token = jwt.sign({ email: ADMIN_EMAIL }, ADMIN_TOKEN_SECRET, { expiresIn: "24h" });
    res.json({ token });
});

// Загрузка врачей
app.get("/admin/doctors", (req, res) => {
    db.all(
        `SELECT d.*, u.email FROM doctors d 
         LEFT JOIN users u ON d.user_id = u.user_id`,
        [],
        (err, doctors) => {
            if (err) {
                console.error("Ошибка получения врачей:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }
            res.json(doctors || []);
        }
    );
});

// Загрузка пользователей
app.get("/admin/users", (req, res) => {
    db.all("SELECT * FROM users", [], (err, users) => {
        if (err) {
            console.error("Ошибка получения пользователей:", err);
            return res.status(500).json({ message: "Ошибка базы данных" });
        }
        res.json(users || []);
    });
});

// Загрузка записей
app.get("/admin/appointments", (req, res) => {
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
                console.error("Ошибка получения записей:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }
            res.json(appointments || []);
        }
    );
});

// Удаление врачей
app.delete("/admin/doctors/:id", authenticateAdminToken, (req, res) => {
    const doctorId = req.params.id;

    db.run(
        `DELETE FROM doctors WHERE doctor_id = ?`,
        [doctorId],
        function (err) {
            if (err) {
                console.error("Ошибка удаления врача:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Врач не найден" });
            }
            res.json({ message: "Врач удалён" });
        }
    );
});

// Удаление пользователей
app.delete("/admin/users/:id", authenticateAdminToken, (req, res) => {
    const userId = req.params.id;

    db.run(
        `DELETE FROM users WHERE user_id = ?`,
        [userId],
        function (err) {
            if (err) {
                console.error("Ошибка удаления пользователя:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Пользователь не найден" });
            }
            res.json({ message: "Пользователь удалён" });
        }
    );
});

// Удаление записей
app.delete("/admin/appointments/:id", authenticateAdminToken, (req, res) => {
    const appointmentId = req.params.id;

    db.run(
        `DELETE FROM appointments WHERE appointment_id = ?`,
        [appointmentId],
        function (err) {
            if (err) {
                console.error("Ошибка удаления записи:", err);
                return res.status(500).json({ message: "Ошибка базы данных" });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Запись не найдена" });
            }
            res.json({ message: "Запись удалена" });
        }
    );
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});