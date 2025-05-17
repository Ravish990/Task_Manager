const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./db/connection');
const passport = require('./service/passport');
const AutomationService = require('./service/automationService');


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
app.use('/invitations', require('./routes/invitationRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/automations', require('./routes/automationRoutes'));


app.get('/dashboard', (req, res) => {
  res.send('API is running...');
});


// Set up scheduled job to check for due date automations
// In a production environment, you would use a proper scheduler like node-cron or a dedicated service
const AUTOMATION_CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
setInterval(() => {
  console.log('Running scheduled automation check for due dates');
  AutomationService.processDueDateAutomations()
    .catch(err => console.error('Error in scheduled automation check:', err));
}, AUTOMATION_CHECK_INTERVAL);


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});