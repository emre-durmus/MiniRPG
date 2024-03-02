//const player = require('../utils/playerUtils.js');
const combatManager = require('../manager/combatManager.js');


module.exports = {
  name: "encounter",
  aliases: ["s", "savas"],
  description: "Savaşmak için canavar arıyorsun!",
  requireCharacter: true,
  execute(message) {
    combatManager.instanciateCombat(message, message.author);
    /*setTimeout(function(){alert("")}, 5 * 1000);
    message.author.deferUpdate();
    const combatId = message.author.channelId.toString();
    combatManager.addPlayerToCombat(message.author, combatId, 1, message.author);*/
  }
}