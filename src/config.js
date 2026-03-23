require('dotenv').config();

const config = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: parseInt(process.env.PORT || '5000', 10),
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

	dbType: process.env.DB_TYPE || 'sqlite',
	dbPath: process.env.DB_PATH || './dentalClinicDB.db',

	jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
	adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
	adminPassword: process.env.ADMIN_PASSWORD || '123456',
	adminTokenSecret: process.env.ADMIN_TOKEN_SECRET || 'admin_dev_secret',

	storageType: process.env.STORAGE_TYPE || 'disk',
	maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),

	imgPath: process.env.IMG_PATH || './img',
	dantistImgPath: './img/dantist',
};

if (config.nodeEnv === 'production') {
	if (config.jwtSecret.includes('dev_') || config.jwtSecret === 'your_secret_key') {
		console.warn('JWT_SECRET содержит дефолтное значение! Установите secure secret.');
	}
	if (config.adminPassword === '123456') {
		console.warn('ADMIN_PASSWORD содержит дефолтное значение! Установите secure password.');
	}
}

module.exports = config;
