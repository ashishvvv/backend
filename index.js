const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; // Use env var for security

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Todo schema and model
const todoSchema = new mongoose.Schema({
  title: String,
  description: String,
  completed: { type: Boolean, default: false },
  completedOn: { type: Date, default: null },
});

const Todo = mongoose.model('Todo', todoSchema);

// Routes

// Get all todos (not completed)
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find({ completed: false });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new todo
app.post('/todos', async (req, res) => {
  try {
    const { title, description } = req.body;
    const newTodo = new Todo({ title, description });
    await newTodo.save();
    res.status(201).json({ message: 'Todo added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit todo by id
app.put('/todos/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete todo by id
app.delete('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark todo as completed
app.post('/todos/:id/complete', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    todo.completed = true;
    todo.completedOn = new Date();
    await todo.save();
    res.json({ message: 'Todo marked as completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get completed todos
app.get('/completed', async (req, res) => {
  try {
    const completedTodos = await Todo.find({ completed: true });
    res.json(completedTodos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete completed todo by id
app.delete('/completed/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ error: 'Completed todo not found' });
    res.json({ message: 'Completed todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});