// Sur votre serveur Railway - bot-production-e4ec.up.railway.app

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

app.use(cors());
app.use(express.json());

// Endpoint pour recevoir les messages du panel
app.post('/api/send-message', async (req, res) => {
  try {
    const { channelId, content, metadata } = req.body;

    // Validation
    if (!channelId || !content) {
      return res.status(400).json({ 
        error: 'channelId et content sont requis' 
      });
    }

    // Récupérer le salon Discord
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      return res.status(404).json({ 
        error: 'Salon non trouvé ou non textuel' 
      });
    }

    // Envoyer le message
    const message = await channel.send({
      content: content, // L'URL de l'image
      // Optionnel : ajouter un embed pour plus de style
      embeds: metadata ? [{
        title: `📋 ${metadata.category} - ${metadata.week}`,
        image: { url: content },
        color: 0xd4af37, // Couleur or
        timestamp: new Date(),
        footer: { text: 'Envoyé depuis Godplace Panel' }
      }] : undefined
    });

    // Log pour debug
    console.log(`Message envoyé dans ${channel.name}: ${message.id}`);

    res.json({ 
      success: true, 
      messageId: message.id,
      channelName: channel.name 
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
});

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    bot: client.user ? 'Connecté' : 'Déconnecté',
    timestamp: new Date().toISOString()
  });
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
