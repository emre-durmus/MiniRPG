const party = require('../utils/partyUtils.js');

module.exports = {
  name: "party",
  aliases: ["grup"],
  description: "Create a party with your friends, and defeat foes together!",
  requireCharacter: true,
  execute(message, args) {
    authorId = message.author.id;

    if(args.length == 0) {
        party.displayParty(message, authorId);
        return;
    }   
    try {
        switch(args[0]) {
            case "yardim":
                party.sendHelp(message);
                break;
            case "ekle":
                if(args.length == 1) {
                    party.sendError(message, "Eklemek istediğin kişiyi etiketlemelisin!");
                    return;
                }
                if(!message.mentions.members.first()) {
                    party.sendError(message, "Eklemek istediğin kişiyi etiketlemelisin!");
                    return;
                }
                party.invite(message, message.mentions.members.first().id);
                break;
            case "göster":
                if(args.length > 1) {
                    const mention = message.mentions.members.first();
                    if(!mention) {
                        party.sendError(message, "Etiketlediğin kişi mevcut değil");
                    } else
                        party.displayParty(message, mention.id);
                } else 
                    party.displayParty(message, authorId);
                break;
            case "ayrıl":
                party.quit(message, authorId);
                break;
            case "at":
                if(args.length == 1 || !message.mentions.members.first()) {
                    party.sendError(message, "Atmak istediğin kişiyi etiketlemelisin!");
                    return;
                }
                party.kick(message, message.mentions.members.first().id);
                break;
            case "dağıt":
                party.disband(message, authorId);
                break;
            default:
                party.sendError(message, "Böyle bir komut yok!");
                break;
        }
    } catch (error) {
        console.error(error);
        message.channel.send("Komut çalıştırılırken bir hata oluştu. Lütfen sorunla ilgili Discord sayfamızda desteğe bilet gönderiniz.");
    }
  }
}