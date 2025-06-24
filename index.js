const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log("Chargement du .env...");
console.log("DISCORD_TOKEN (env) :", process.env.DISCORD_TOKEN || "non chargé");

const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

app.post('/send', async (req, res) => {
  const { channelId, imageUrl, description } = req.body;

  if (!channelId || !imageUrl) {
    return res.status(400).send('channelId et imageUrl requis');
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return res.status(404).send('Salon introuvable');

    await channel.send({
      content: description || '',
      files: [imageUrl]
    });

    res.send('Message envoyé');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API en écoute sur le port ${PORT}`);
});
