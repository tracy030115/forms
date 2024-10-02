require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

app.use(cors());
app.use(bodyParser.json());

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

const formSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  formName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  questions: [
    {
      type: {
        type: String,
        enum: ['multiple-choice', 'open-ended'],
        required: true
      },
      question: String,
      options: [String],
    },
  ],
});

const responseSchema = new mongoose.Schema({
  formId: { type: String, required: true },
  responses: { type: Object, required: true },
});

const User = mongoose.model('User', userSchema);
const Form = mongoose.model('Form', formSchema);
const Response = mongoose.model('Response', responseSchema);

mongoose.connect(process.env.MONGODB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: true
}));

app.get('/', async (req, res) => {
  const { email, password } = req.query;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.send('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.email = user.email;
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
      return res.send('Need email or password');
    }
  
    try {
      const existingUser = await User.findOne({ email }).exec();
      if (existingUser) {
        return res.send('Existing user');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
      return res.send('Successfully registered');
    } catch (error) {
      return res.send('Error');
    }
  });

  app.get('/dashboard', async (req, res) => {
    try {
      const email = req.session.email;
      const forms = await Form.find({ email }).exec();
      return res.send(forms);
    } catch (error) {
      return res.send('Error retrieving forms');
    }
  });

app.get('/create', async (req, res) => {
  const { formName, description, questions } = req.query;
  const email = req.session.email;

  if (!formName || !description) {
    return res.send('No form name or description found');
  }

  try {
    const existingForm = await Form.findOne({ formName }).exec();
    if (existingForm) {
      return res.send('existing form name');
    }

    const newForm = new Form({ email, formName, description, questions });
    await newForm.save();
    return res.send('Successfully created form');
  } catch (error) {
    return res.send('Error');
  }
});

app.get('/form/:formId', async (req, res) => {
  const form = await Form.findOne({ _id: req.params.formId });
  if (!form) {
    return res.send('Form not found');
  }
  return res.send(form);
});


app.get('/submit/:formId', async (req, res) => {
  const { formId } = req.params;
  const responses = req.query;

  try {
    const formExists = await Form.findOne({ _id: formId });
    if (!formExists) {
      return res.send('Form not found');
    }

    const newResponse = new Response({ formId, responses });
    await newResponse.save();

    res.send('Responses recorded successfully');
  } catch (err) {
    res.send('Error recording responses');
  }
});

app.get('/responses/:formId', async (req, res) => {
  const { formId } = req.params;

  try {
    const responses = await Response.find({ formId });
    return res.send(responses);
  } catch (err) {
    return res.send('Error fetching responses');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(process.env.PORT, () => {
  console.log(`server listening on ${process.env.PORT}`);
});
