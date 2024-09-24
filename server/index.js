require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();


app.use(cors());
// app.use(bodyParser.json());


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

  app.get('/', async (req, res) => {
    const { email, password } = req.query;
  
    try {
      if (!email || !password) {
        return res.send('Email and password are required');
      }
  
      const user = await User.findOne({ email }).exec();
      if (!user) {
        return res.send('User not found');
      }
  
      const match = bcrypt.compare(password, user.password);
      if (match) {
        console.log('Success!');
        return res.send('Login successful');
      } else {
        return res.send('Wrong password');
      }
    } catch (error) {
      return res.send('Error');
    }
  });
  
  

  app.get('/register', async (req, res) => {
    const { email, password } = req.query;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.status(409).json({ message: 'Existing user' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
      return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error', error });
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
