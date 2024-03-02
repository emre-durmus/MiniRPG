const { EmbedBuilder } = require("@discordjs/builders");
const player = require("../../utils/playerUtils.js");
const regionsData = require("../../data/regions.json");
const zonesData = require("../../data/zones.json");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");

module.exports = {
  name: "location",
  interact: async function (interaction, values, args) {
    switch (args[0]) {
      case "travel":
        if (args[1] != interaction.user.id) {
          interaction.deferUpdate();
          return;
        }

        interaction.message.delete();
        player.setLocation(interaction.user.id, values[0]);
        const embed = new EmbedBuilder().setDescription(
          "🪶  **" +
            interaction.user.username +
            "**, **" +
            zonesData[values[0]].name +
            "**" +
            " bölgesine ışınlandı."
        );

        interaction.channel.send({ embeds: [embed] });

        if (zonesData[values[0]].name == "Birinci Köy") {
            const returnVal = await player.passiveRegen(interaction.user.id);
            const embed2 = new EmbedBuilder().setColor(0xf898aa);
  
            if (returnVal.gainedHealth > 0) {
              embed2.addFields({
                name: ":hibiscus: Hp yenilendi",
                value: `Şuan ${returnVal.health} HP :heart: (+${returnVal.gainedHealth}) `,
              });
              interaction.channel.send({ embeds: [embed2] });
            }
          }
        break;
      case "change_location":
        if (args[1] != interaction.user.id) {
          interaction.deferUpdate();
          return;
        }

        const locationData = Object.values(regionsData);
        const zonesOptions = [];

        const location = locationData.find(
          (location) => location.id == values[0]
        );
        for (const zone of location.zones) {
          zonesOptions.push({
            label: zonesData[zone].name,
            value: zone,
            description: zonesData[zone].description,
          });
        }

        const slider = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("location-travel-" + interaction.user.id)
            .setPlaceholder("Select a place to go to!")
            .addOptions(zonesOptions)
        );

        const button = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("location-far_travel-" + interaction.user.id)
            .setLabel("Go somewhere else")
            .setStyle(ButtonStyle.Secondary)
        );

        interaction.message.edit({ components: [slider, button] });
        interaction.deferUpdate();
        break;
      default:
        break;
    }
  },
};
