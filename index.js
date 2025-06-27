const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const cors = require('cors');

const app = express();
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

app.use(cors());
app.use(express.json());

// Endpoint de santé pour tester la connexion
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    bot: client.user ? `Connecté (${client.user.tag})` : 'Déconnecté',
    timestamp: new Date().toISOString(),
    guilds: client.guilds.cache.size
  });
});

// Endpoint pour envoyer des messages
app.post('/api/send-message', async (req, res) => {
  try {
    const { channelId, content, metadata } = req.body;

    // Validation
    if (!channelId || !content) {
      return res.status(400).json({ 
        error: 'channelId et content sont requis' 
      });
    }

    // Vérifier si le bot est connecté
    if (!client.user) {
      return res.status(503).json({ 
        error: 'Bot Discord non connecté' 
      });
    }

    // Récupérer le salon Discord
    const channel = await client.channels.fetch(channelId).catch(err => {
      console.error(`Erreur lors de la récupération du salon ${channelId}:`, err);
      return null;
    });
    
    if (!channel) {
      return res.status(404).json({ 
        error: 'Salon non trouvé',
        details: 'Vérifiez que l\'ID du salon est correct et que le bot a accès au serveur'
      });
    }

    if (!channel.isTextBased()) {
      return res.status(400).json({ 
        error: 'Le salon n\'est pas un salon textuel' 
      });
    }

    // Vérifier les permissions
    const permissions = channel.permissionsFor(client.user);
    if (!permissions || !permissions.has([
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages
    ])) {
      return res.status(403).json({ 
        error: 'Permissions insuffisantes',
        details: 'Le bot n\'a pas les permissions pour voir ou écrire dans ce salon'
      });
    }

    // Envoyer le message
    const message = await channel.send({
      content: content,
      embeds: metadata ? [{
        title: `📋 ${metadata.category} - ${metadata.week}`,
        image: { url: content },
        color: 0xd4af37,
        timestamp: new Date(),
        footer: { text: 'Envoyé depuis Godplace Panel' }
      }] : undefined
    });

    console.log(`Message envoyé dans ${channel.name} (${channel.id}): ${message.id}`);

    res.json({ 
      success: true, 
      messageId: message.id,
      channelName: channel.name,
      channelId: channel.id
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi:', error);
    
    // Messages d'erreur spécifiques
    let errorMessage = 'Erreur interne du serveur';
    let details = error.message;
    
    if (error.code === 50001) {
      errorMessage = 'Missing Access';
      details = 'Le bot n\'a pas accès à ce salon ou serveur';
    } else if (error.code === 10003) {
      errorMessage = 'Unknown Channel';
      details = 'Salon introuvable';
    } else if (error.code === 50013) {
      errorMessage = 'Missing Permissions';
      details = 'Permissions insuffisantes pour envoyer des messages';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: details,
      code: error.code || 'UNKNOWN'
    });
  }
});

// Gestion des événements du bot
client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
  console.log(`Présent sur ${client.guilds.cache.size} serveur(s)`);
});

client.on('error', console.error);

// Connexion du bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Erreur de connexion Discord:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
