const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/tickets',        require('./routes/tickets'));
app.use('/api/schedules',      require('./routes/schedules'));
app.use('/api/rooms',          require('./routes/rooms'));
app.use('/api/cleaners',       require('./routes/cleaners'));
app.use('/api/client-meetings',require('./routes/clientMeetings'));
app.use('/api/stock',          require('./routes/stock'));

app.get('/', (req, res) => res.json({ status: 'Servidor rodando!' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
