// --- FIX for Node.js v24 SRV DNS bug on Windows ---
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
// ---------------------------------------------------
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import './automation/scheduler.js';


// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "token", "aToken", "dToken"], 
}));

// api endpoints 
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);

app.get('/', (req, res) => {
  res.send('API WORKING');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});