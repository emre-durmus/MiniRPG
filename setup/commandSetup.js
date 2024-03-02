const fs = require('fs');
const { Collection } = require('discord.js');
const { commandFolders } = require("../config.json");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');


module.exports = {
  setupCommands(client, token, APP_ID) {
    //console.log(commandFolders);
    console.groupCollapsed("-- Komutlar --");
    client.commands = new Collection(); 
    // Get every JS command file
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    client.commands.set([]);
    // Setup a new collection for the commands
    for (const file of commandFiles) {
      console.log(`Komut yükleniyor: ${file}`);
      const command = require(`./../commands/${file}`);
      client.commands.set(command.name, command);

      if(!command.aliases)
        continue;

      for (const alias of command.aliases) {
        console.log(`- Çağrı yükleniyor: ${alias}`);
        client.commands.set(alias, command);

      }
    }

    for(const folder of commandFolders) {
      const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        console.log(`Komut yükleniyor: /${folder}/${file}`);
        const command = require(`./../commands/${folder}/${file}`);

        client.commands.set(command.name, command);

        if(!command.aliases)
          continue;

        for (const alias of command.aliases) {
          console.log(`- Çağrı yükleniyor: ${alias}`);
          client.commands.set(alias, command);
        }
      }
    }
    console.groupEnd();
  }
}