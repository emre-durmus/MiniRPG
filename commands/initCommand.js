const player = require('../utils/playerUtils.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "init",
    aliases: ["basla", "b"],
    description: "",
    requireCharacter: false,
    async execute(message, args) {
        const author = message.author;

        if(!(await player.doesExists(author.id))) {
            const embed = new EmbedBuilder()
                .setTitle(":crossed_swords: MiniMt2 Dünyasına Hoşgeldin !")
                .setDescription("Hoşgeldin " + author.username + ", MiniMt2 Dünyasına katıldığını görmek güzel! Ben Ejderha Tanrısının elçisi, bu krallığın yöneticilerinden biriyim. Sana ben rehberlik edeceğim. Hadi Başlayalım!")
                .setColor(0xFF7F50)

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("welcome-0-" + author.id)
                        .setLabel("Devam Et")
                        .setStyle(ButtonStyle.Secondary)
                )

            message.channel.send({embeds: [embed], components: [button]});
        } else { 
            const displayEmbed = new EmbedBuilder()
                .setTitle("Zaten maceranın bir parçasısın!")
                .setDescription("Birden fazla karaktere sahip olamazsın.")
        
            message.channel.send({embeds: [displayEmbed]});
        }
    }
}