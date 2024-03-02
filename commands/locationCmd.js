const player = require("../utils/playerUtils.js");
const regionsData = require("../data/regions.json");
const zoneData = require("../data/zones.json");
const { EmbedBuilder } = require("@discordjs/builders");

module.exports = {
    name: "location",
    aliases: ["map"],
    description: "Bulunduğun yer hakkında bilgi al.",
    requireCharacter: true,
    async execute(message, args) {
        const locationInfo = (await player.getData(message.author.id, "story")).location;
        const zone = zoneData[locationInfo.zone];

        const embed = new EmbedBuilder()
            .setTitle(zone.name)
            .setDescription(zone.description)
            .addFields(
                { name: "Şuanda bu bölgedesin", value: regionsData[locationInfo.region].name, inline: true },
                { name: "Canavarlar mevcut mu ?", value: (Object.values(zone.monsters).length > 0) ? "Evet" : "Hayır", inline: true },
            )

        if(zone.color !== undefined) 
            embed.setColor(zone.color);

        message.channel.send({ embeds: [embed] });
    }
}