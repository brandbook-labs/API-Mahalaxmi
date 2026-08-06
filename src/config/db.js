require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URL, {
        dbName: process.env.DB_NAME || 'Production'
       });
       
       console.log(`MongoDB connected successfully (database: ${process.env.DB_NAME || 'Production'})`);
    } catch (error) {
        console.error('Error connecting to MongoDB: ', error.message);
    }
}

module.exports = connectDB;