const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./db/connection');
const passport = require('./service/passport');


dotenv.config();

connectDb();


const app = express();


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,             
}));


app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);


app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/projects', require('./routes/projectRoutes'));


app.get('/dashboard', (req, res) => {
  res.send('API is running...');
});




const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});