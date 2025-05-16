const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const connectDb = () => mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});


module.exports = connectDb;