const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/services', require('./routes/services'));
app.use('/areas', require('./routes/areas'));

// Route about.json (obligatoire selon le sujet)
app.get('/about.json', (req, res) => {
  res.json({
    client: {
      host: req.ip,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: [
        {
          name: 'gmail',
          actions: [
            { name: 'new_email', description: 'Un nouvel e-mail est reçu' },
            { name: 'email_from', description: 'E-mail reçu d\'un expéditeur précis' },
          ],
          reactions: [
            { name: 'send_email', description: 'Envoie un e-mail' },
          ],
        },
        {
          name: 'github',
          actions: [
            { name: 'new_issue', description: 'Une nouvelle issue est ouverte' },
            { name: 'new_pr', description: 'Une nouvelle pull request est créée' },
          ],
          reactions: [
            { name: 'create_issue', description: 'Crée une issue' },
          ],
        },
      ],
    },
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});