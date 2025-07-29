import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import errorHandling from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//Routes
app.use('/api', userRoutes);

//Error handling middleware
app.use(errorHandling);

// POSTGRES Test Connnection
app.get("/",async (req, res) => {
    const result = await pool.query("SELECT current_database()");
    console.log("end");
    res.send(`Postgres connected successfully: ${result.rows[0].current_database}`);
});

//Server running
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

