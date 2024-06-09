const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const User = require('./models/user');
const authMiddleware = require('./middlewares/auth');

const app = express();
app.use(express.json());

const PORT = 3000;
const MONGO_URI = 'mongodb+srv://admin:admin@devweb.wabaiwo.mongodb.net/';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).send('Credenciais inválidas');
  }
  const token = jwt.sign({ id: user._id }, 'secrectKey', { expiresIn: '1d' });
  res.json({ token });
});

app.post('/register', async (req, res) => {
  const { nome, email, password, role } = req.body;
  try {
    const user = new User({ nome, email, password, role });
    await user.save();
    res.status(201).send('Usuário registrado com sucesso');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/users', authMiddleware, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.put('/users/:id', authMiddleware, async (req, res) => {
  const { nome, email, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send('Usuário não encontrado');
  }
  user.nome = nome;
  user.email = email;
  user.role = role;
  await user.save();
  res.send('Usuário atualizado com sucesso');
});

app.post('/users', authMiddleware, async (req, res) => {
  const { nome, email, password, role } = req.body;
  const user = new User({ nome, email, password, role });
  await user.save();
  res.status(201).send('Usuário criado com sucesso');
});

app.delete('/users/:id', authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.send('Usuário deletado com sucesso');
});

app.get('/users/count', authMiddleware, async (req, res) => {
  const count = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  res.json(count);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
