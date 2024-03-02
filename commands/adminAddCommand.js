const { Client, MessageEmbed } = require('discord.js');
const permsUtils = require('../utils/permsUtils.js');

module.exports = {
    name : "add",
    aliases: [],
    description: "Ajouter des permissions admin à une commande",


    execute(message, args) {

        if (args.length < 1)
            return;
            
            permsUtils.doesPermExists(args[0]).then(exists => {
                if(!exists) {
                    permsUtils.addAdmin(args[0]);
                    message.reply('debug: added admin perm to this command');
                } else {
                    message.reply('debug: user already has admin perm for this command');
                }
        });
    }
}