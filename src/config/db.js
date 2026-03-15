require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URL, {
        dbName: 'Production'
        // dbName: 'Development'
       });
       console.log('MongoDB connected successfully');   
    } catch (error) {
        console.error('Error connecting to MongoDB: ', error.message);
    }
}

module.exports = connectDB;