const messageUtils = require('../utils/messageTemplateUtils.js');

module.exports = {
    name: "shop",
    aliases: ["satici","market"],
    description: "",
    requireCharacter: true,
    execute(message, args) {

            messageUtils.generateShopSelector(message);
        
            return;
    }
}