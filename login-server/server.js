const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

// Functions
const isProduction = process.env.NODE_ENV === 'production';

// Function to hash a password using SHA-256
function hashPasswordSHA256(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Example login function
function verifyPassword(inputPassword, storedHash) {
  const hashedInput = hashPasswordSHA256(inputPassword);
  return hashedInput === storedHash;
}

const app = express();
app.use(cookieParser());

const allowedOrigins = ['https://willbott.github.io'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow tools like Postman or server-to-server requests

    if (allowedOrigins.includes(origin)) {
      callback(null, origin); // Echo back the requesting origin (important for credentials)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(bodyParser.json());

// Configure your MySQL connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

app.get('/auth/check', (req, res) => {
  const token = req.cookies.auth_token;
  console.log(req.cookies)
  console.log(req.headers)
  if (!token) {
    console.log('No cookie')
    return res.status(401).json({ error: 'No auth token' });
  }

  const secretKey = process.env.JWT_SECRET;
  try {
    const payload = jwt.verify(token, secretKey);
    // Optionally fetch user info from DB here
    console.log('Enter')
    res.json({ userId: payload.userId });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: isProduction,    // Set true if you use HTTPS in production
      sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit each IP to 10 login requests per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
});

// Login endpoint
app.post('/login', loginLimiter, async (req, res) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch user by username
    const [rows] = await connection.execute(
      'SELECT id, password FROM users WHERE username = ?',
      [username]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const hashedPassword = user.password;

    // Compare passwords
    const match = verifyPassword(password, hashedPassword)

    if (match) {
      // User authenticated
      const expiresIn = rememberMe ? '30d' : '2h';
      const secretKey = process.env.JWT_SECRET;
      const token = jwt.sign({userId: user.id}, secretKey, {expiresIn});
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction, // ✅ set to true for production
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
        sameSite: 'lax',
      });      

      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});