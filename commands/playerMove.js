const { Client, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const player = require("../utils/playerUtils.js");
const regionsData = require('../data/regions.json');
const zonesData = require('../data/zones.json');

module.exports = {
    name: "move",
    aliases: ["tp", "m"],
    description: "",
    requireCharacter: true,
    async execute(message, args) {
        var availableLocations = []; // Array of locations that the player can go to
        const playerInfo = await player.getData(message.author.id, "info");
        const playerStory = await player.getData(message.author.id, "story");
        const playerInventory = await player.getData(message.author.id, "inventory");

        const playerRegion = regionsData[playerStory.location.region]; // Data of the location the player is in
        const playerZone = zonesData[playerStory.location.zone]; // Data of the zone the player is in


        if(playerInfo.state.name == "in-combat"){
          const embed2 = new EmbedBuilder()
            .setColor(0xADD8E6)
            .setDescription('Bu işlemi gerçekleştiremezsin!')
            .addFields(
                { name: 'Hata', value: 'Karakterin şu anda savaşta'},
            )
            .setFooter({text: 'Savaştan sonra bu komutu tekrar kullanabilirsin'})
            await message.reply({embeds: [embed2], components: [] });
            return;
        }

        /*if(playerInfo.health <= 0) {
        message.reply({ content:"Karakterin ölü!", ephemeral: true});
        return; 
        }*/

      
        if(playerRegion == undefined)
            return;

        for(const zone of playerRegion.zones) {
            const zoneData = zonesData[zone]; // Data of the specific zone

            if(playerStory.location.zone == zone) {
                continue;
            }

            if(zoneData.required.level != undefined) {
                if(playerInfo.level < zoneData.required.level) {
                    console.log("Seviye çok düşük: " + zoneData.required.level);
                    continue;
                }
            }

            var hasItem = true;
            if(zoneData.required.items != undefined) {
                for(const item of zoneData.required.items) {
                    if(!Object.entries(playerInventory.items).includes(item)) {
                        console.log("Gerekli eşyaya sahip değilsin: " + item);
                        hasItem = false;
                    }
                }
            }
            if(!hasItem)
                continue;

            availableLocations.push({
                label: zoneData.name,
                value: zone,
                description: zoneData.description
            });
        }

        const embed = new EmbedBuilder()
            .setDescription('Şu andaki bölgen :')
            .addFields(
                { name: playerZone.name, value: 'Nereye ışınlanmak istersin?'},
            )
            .setFooter({text: 'Nerede olduğunu mu öğrenmek istiyorsun? Bu komutu kullan: `mmap` '})

        if(playerZone.color != undefined)
            embed.setColor(playerZone.color);

        const slider = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('location-travel-' + message.author.id)
                    .setPlaceholder('Işınlanmak istediğin yeri seç!')
                        .addOptions(availableLocations),
            );
        
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('location-far_travel-' + message.author.id)
                    .setLabel('Başka bir bölgeye git')
                    .setStyle(ButtonStyle.Secondary)
            );
    
        if(playerStory.location.unlocked_regions.length <= 1) {
            await message.reply({embeds: [embed], components: [slider] });
            message.delete();
        } else {
            await message.reply({embeds: [embed], components: [slider, button] });
            message.delete();
        }
    }
}