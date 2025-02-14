const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://primewish08:wiprimesh134@primeclustwe.077zr.mongodb.net/?retryWrites=true&w=majority&appName=PRIMECLUSTWE';

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// Connection Success
db.once('open', async () => {
    console.log('✅ MongoDB Connected Successfully');

    // Define a Schema
    const userSchema = new mongoose.Schema({
        name: String,
        email: String,
        age: Number
    });

    // Create a Model (Collection)
    const User = mongoose.model('User', userSchema);

    // Insert Data into Collection
    try {
        const newUser = new User({ name: 'John Doe', email: 'john@example.com', age: 25 });
        await newUser.save();
        console.log('✅ New User Added to Database');
    } catch (error) {
        console.error('❌ Error Adding User:', error);
    }
});

// Connection Error
db.on('error', (err) => {
    console.error('❌ MongoDB Connection Error:', err);
});

// Connection Disconnected
db.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});
