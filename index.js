// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { MongoClient } = require('mongodb');

require('dotenv').config();

// Create a new client instance
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent]});

const { setup } = require('./setup.js');
const express = require('express');
const app = express();
const port = 8080;
app.get('/', (req, res) => res.send('Bot aktif!'));
app.listen(port, () => console.log(`Bot şu adreste çalışıyor. http://localhost:${port}`));
setup(client);

// Setup mongo
Client.client = client;
Client.mongoDB = new MongoClient(process.env.MONGO_URI);

// Prevents a weird node warning
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

client.once('ready', () => {
  console.log('\u001b[1;32mMiniMt2\ Bot başlatıldı.' + ' \u001b[0m');

  const statuses = [
    'Yeni misin? mh yazarak komutları öğrenebilirsin',
    'Yeni misin? mh yazarak komutları öğrenebilirsin',
    'Geliştirme versiyonudur!',
  ]

  client.user.setActivity("Başlatılıyor...", { type: ActivityType.Playing });
  //client.user.setAvatar('https://media.discordapp.net/attachments/1212586011033477152/1212869519089864754/animated-ezgif.com-crop.gif?ex=65f367c3&is=65e0f2c3&hm=95a8338edf6c96c3d6e8e1f6d9b3804ce1f35acc924391cb25026a7d68a90905&=');
  let i = 0;
  setInterval(() => {
    client.user.setActivity(statuses[i], { type: ActivityType.Playing });
    i = ++i % statuses.length;
  }, 10000);
});


client.login(process.env.BOT_TOKEN);
