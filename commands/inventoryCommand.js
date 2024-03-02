const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js');
const inv = require('../utils/inventoryUtils.js');

module.exports = {
    name: "display",
    aliases: [ "inv", "inventory","c","p"],
    description: "",
    requireCharacter: true,
    async execute(message, args) {
        const author = message.author;
        
        var embed = new EmbedBuilder();
        embed.setAuthor({name: "Karakter : " + author.username, iconUrl: author.avatarURL})
        .setThumbnail(author.displayAvatarURL());

        const buttons = new ActionRowBuilder();

        if(args.length == 0) {
            ret = (await inv.typeMain(embed, author.id)).embed;
        } else {
            switch(args[0]) {
                case "items":
                case "item":
                case "it":
                case "inv":
                case "inventory":
                    ret = (await inv.typeItems(embed, author.id)).embed;
                    break;
                case "abilities":
                case "ability":
                case "abi":
                    ret = (await inv.typeAbilities(embed, author.id));
                    buttons.addComponents(ret.components);
                    ret = ret.embed;
                    break;
                case "stats":
                case "stat":
                case "st":
                    ret = (await inv.typeStats(embed, author.id)).embed;
                    break;
                case "equip":
                case "equipment":
                case "e":
                    ret = (await inv.typeEquipment(embed, author.id));
                    buttons.addComponents(ret.components);
                    ret = ret.embed;
                    break;
                default:
                    ret = (await inv.typeMain(embed, author.id)).embed;
                    break;
            }
        }

        var row = new ActionRowBuilder();
        row.addComponents(inv.addSlider(author.id));

        const componentList = [];

        componentList.push(row);


        message.channel.send({ embeds: [ret], components: componentList });
    }
}