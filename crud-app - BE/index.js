const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Task = require('./models/task');  // Import Task model
const authMiddleware = require('./middlewares/auth');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devweb';
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('Credenciais inválidas');
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

app.post('/register', async (req, res) => {
  const { nome, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ nome, email, password: hashedPassword, role });
    await user.save();
    res.status(201).send('Usuário registrado com sucesso');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

app.put('/users/:id', authMiddleware, async (req, res) => {
  const { nome, email, role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('Usuário não encontrado');
    }
    user.nome = nome;
    user.email = email;
    user.role = role;
    await user.save();
    res.send('Usuário atualizado com sucesso');
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

app.post('/users', authMiddleware, async (req, res) => {
  const { nome, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ nome, email, password: hashedPassword, role });
    await user.save();
    res.status(201).send('Usuário criado com sucesso');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send('Usuário deletado com sucesso');
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

app.get('/users/count', authMiddleware, async (req, res) => {
  try {
    const count = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    res.json(count);
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

// New routes for tasks

// List tasks of the logged-in user
app.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

// Edit a specific task of the logged-in user
app.put('/tasks/:id', authMiddleware, async (req, res) => {
  const { description, done } = req.body;
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).send('Tarefa não encontrada');
    }
    task.description = description !== undefined ? description : task.description;
    task.done = done !== undefined ? done : task.done;
    await task.save();
    res.send('Tarefa atualizada com sucesso');
  } catch (error) {
    res.status(500).send('Erro no servidor');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
