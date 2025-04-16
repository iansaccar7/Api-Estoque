const express = require('express');
const cors = require('cors');
const tampasRoutes = require('./routes/tampas'); // Mudança para require()

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tampas', tampasRoutes);

app.listen(3001, () => {
    console.log('API rodando em http://localhost:3001');
});
