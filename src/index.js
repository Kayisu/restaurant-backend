import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import errorHandling from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);

app.use(errorHandling);

app.get("/",async (req, res) => {
    const result = await pool.query("SELECT current_database()");
    console.log("end");
    res.send(`Postgres connected successfully: ${result.rows[0].current_database}`);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

