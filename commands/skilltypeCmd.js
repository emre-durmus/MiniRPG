const player = require('../utils/playerUtils.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

module.exports = {
    name: "egitmen",
    aliases: ["egitim"],
    description: "",
    requireCharacter: true,
    async execute(message, args) {
      const author = message.author;
      if((await player.is5Level(author.id))) {
        if(!(await player.ishaveskilltype(author.id))){
        const embed = new EmbedBuilder();
                embed
                    .setTitle(":crossed_swords: Beceri Sınıfı! :crossed_swords:")
                    .setDescription("Tebrikler "+ author.username +", biraz tecrübe edindin ve artık yetenek sınıfını seçmeye hazırsın! Sana uygun olanı seç ve maceranda yeni kapıları aç!")
                    .setColor(0xFF7F50)
        
            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("welcome-3-" + author.id)
                        .setLabel("Devam Et")
                        .setStyle(ButtonStyle.Secondary)
                )
            message.channel.send({embeds: [embed], components: [button]});
          }else {
          const displayEmbed2 = new EmbedBuilder()
                .setColor('FF0000')
                .setTitle("Zaten yetenek sınıfını seçtin!")
                .setDescription("Daha önceden bu seçimi yaptın.")
        
            message.channel.send({embeds: [displayEmbed2]});
          }
        } else { 
            const displayEmbed = new EmbedBuilder()
                .setColor('FF0000')
                .setTitle("Henüz yeterli seviyede değilsin!")
                .setDescription("Öncelikle karakterini 5.seviyeye kadar geliştir.")
        
            message.channel.send({embeds: [displayEmbed]});
        }
    }
}