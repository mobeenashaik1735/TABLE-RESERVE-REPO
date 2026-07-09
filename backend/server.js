const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const otpRoutes = require('./routes/otpRoutes');
const qrRoutes = require('./routes/qrRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const featureRoutes = require('./routes/featureRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startReminderCron } = require('./cron/reminders');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Provide a default JWT secret so registration/login works out of the box
process.env.JWT_SECRET = process.env.JWT_SECRET || 'tablereserve-super-secret-key';

app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
  });

  socket.on('joinUser', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/notifications', notificationRoutes);

startReminderCron(io);

// Integrate Vite Dev Server / Static files serving after API routes!
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = require('vite');
    const path = require('path');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, '../frontend')
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware integrated successfully.');
  } else {
    const path = require('path');
    const distPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving built static files from /frontend/dist.');
  }
}

const PORT = 3000;

async function start() {
  await setupVite();

  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);

    // Automatically setup and seed database
    try {
      console.log('--- Database Auto-Initialization Started ---');
      const pool = require('./config/db');
      let needsMigration = false;
      try {
        await pool.query("SELECT 1 FROM users LIMIT 1");
        console.log('[Server] DB Check] The "users" table already exists. Preserving database state.');
      } catch (e) {
        console.log('[Server] DB Check] The "users" table was not found. Database migration needed.');
        needsMigration = true;
      }

      if (needsMigration) {
        // 1. Run migrations to create tables safely
        console.log('Running automatic migrations...');
        const migrate = require('./scripts/migrate');
        if (typeof migrate === 'function') await migrate();

        // 2. Run seed script to add your 47 restaurants 
        console.log('Running automatic database seeding...');
        const seed = require('./scripts/seed');
        if (typeof seed === 'function') await seed();

        console.log('--- Database Auto-Initialization Successful ---');
      } else {
        console.log('Database already initialized. Skipping auto-migration and seeding to preserve user data.');
        console.log('--- Database Auto-Initialization Completed ---');
      }

      // Ensure notifications table is always created
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          email VARCHAR(255),
          phone VARCHAR(20),
          type VARCHAR(50),
          subject VARCHAR(255),
          message TEXT,
          sent_via_smtp BOOLEAN DEFAULT false,
          sent_via_sms BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch (dbError) {
      console.error('Database setup skipped or ran into an error:', dbError.message);
    }
  });
}

start();