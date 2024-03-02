const { EmbedBuilder } = require("discord.js");
const util = require("../utils/abilityUtils.js");

module.exports = {
  name: "ability",
  aliases: ["skill", "yetenek"],
  description: "Get information about different abilities!",
  requireCharacter: true,
  async execute(message, args) {
    if(args.length == 0) {
        message.reply("Lütfen yetenek numarası giriniz!");
        return;
    }
            const { name: id, ability } = util.searchAbility(args.slice(0).join(" "));
            if(id == null) {
                message.reply("Yetenek bulunamadı!");
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle("#" + ability.number + " - "  + ability.name)
                .setDescription(ability.description)

            switch(ability.aim) {
                case "self":
                    embed.addFields({name: "Hedef", value: "Kendine"});
                    break;
                case "enemy-single":
                    embed.addFields({name: "Hedef", value: "Tek Düşman"});
                    break;
                case "enemy-aoe":
                    embed.addFields({name: "Hedef", value: "Bütün Düşmanlar"});
                    break;
                case "ally-single":
                    embed.addFields({name: "Hedef", value: "Tek Grup Üyesi"});
                    break;
                case "ally-aoe":
                    embed.addFields({name: "Hedef", value: "Bütün Grup Üyeleri"});
                    break;
                case "ally+self-single":
                    embed.addFields({name: "Hedef", value: "Bir Grup Üyesi veya Kendine"});
                    break;
                case "ally+self-aoe":
                    embed.addFields({name: "Hedef", value: "Bütün Grup Üyeleri ve kendine"});
                    break;
                default:
                    embed.addFields({name: "Hedef", value: "Bilinmiyor"});
                    break;
            }
       message.reply({ embeds: [embed] });
    return;
  }
}

