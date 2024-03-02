const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders")
const { ButtonStyle } = require("discord.js")

module.exports = {
    name: "invite",
    aliases: ["davet"],
    description: "Discord sunucumuza ulaşman için davet bağlantısını verir!",
    requireCharacter: true,
    execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle("Minimt2 Davet!")
          .setThumbnail("https://i.hizliresim.com/k5tzas7.png")
            .addFields(
                { name: "Davet Bağlantıları", value: "Sunucumuza Katıl veya Kendi Sunucuna Ekle"}
            )

            const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                  .setLabel("Minimt2'yi sunucuna davet et")
                  .setURL("https://discord.com/oauth2/authorize?client_id=1213412780208558142&permissions=8&scope=bot")
                  .setStyle(ButtonStyle.Link),
              new ButtonBuilder()
                  .setLabel("Minimt2 Sunucusuna Katıl!")
                  .setURL("https://discord.gg/4kktwbVwVU")
              .setStyle(ButtonStyle.Link),
            )

        message.channel.send({ embeds: [embed], components: [row] });
    }
}
