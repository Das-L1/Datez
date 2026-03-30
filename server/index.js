const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/swipes', require('./routes/swipes'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/vacations', require('./routes/vacations'));
app.use('/api/spica', require('./routes/spica'));

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Datez server on http://localhost:${PORT}`));
