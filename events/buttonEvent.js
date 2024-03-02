const fs = require("fs");
const player = require('../utils/playerUtils.js');
const inventory = require('../utils/inventoryUtils.js');
const equip = require('../utils/equipUtils.js'); 
const selector = require('../utils/messageTemplateUtils.js');
const shopsData = require('../data/shops.json');
const { displayInventory } = require('../utils/inventoryUtils.js');
const { startCombat, addPlayerToCombat, removePlayerFromCombat } = require('../manager/combatManager.js');
const { acceptInvitation } = require('../utils/partyUtils.js');
const { sendStringAllAbilities, sendModal } = require('../utils/abilityUtils.js');
const { receiveButton } = require('../utils/equipUtils.js');
const { Client,EmbedBuilder } = require("discord.js");

const buttons = new Map();

module.exports = {
    name: 'interactionCreate',
    async setupButtons(client) {
        const eventFiles = fs.readdirSync("./interactions/buttons").filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const button = require(`./../interactions/buttons/${file}`);
            buttons.set(button.name, button);
        }

    },
    async trigger(interaction, client) {
        if(interaction.message.author.id != client.user.id) return;
        if (!interaction.isButton()) return;
	    
        const { user, customId } = interaction;
        const userId = user.id;

        const args = customId.split('-');
        const command = args.shift();

        try {
            // The only button supported without a player is the welcome button
            if(command == "welcome") {
                buttons.get(command).interact(interaction, args);
                return;
            }
            if(command == "skillmsg") {
                buttons.get(command).interact(interaction, args);
                return;
            }

            if(!(await player.doesExists(user.id))) return;

            // console.log("Command: " + command);
            // console.log("Args: " + args);

            switch(command) {
                case 'displayInventory':
                    displayInventory(userId, interaction); // Displays the inventory of a player (inventoryUtils.js)
                    return;
                case 'displayAbilities':
                    const ret = await sendStringAllAbilities(user.username, userId); // Displays all the abilities of a player (abilityUtils.js)
                    interaction.reply(ret);
                    return;
                case 'selectAbility':
                    sendModal(interaction, true, args[0]);
                    return;
                case 'unselectAbility':
                    sendModal(interaction, false, args[0]);
                    return;
                case 'joinFight':
                    await addPlayerToCombat(user, args[0], args[1], interaction); // Adds a player to a combat (combatManager.js)
                    return;
                case 'leaveFight':
                    await removePlayerFromCombat(userId, args[0], interaction); // Removes a player from a combat (combatManager.js)
                    return;
                case 'combat_start':
                    await startCombat(interaction); // Starts a combat (combatManager.js)
                    return;
                case 'party_accept':
                    await acceptInvitation(userId, args[0], interaction); // Accepts a party invitation (partyUtils.js)
                    return;
                case 'equip':	
                    receiveButton(interaction, userId, args); // Personal button handler (equipUtils.js)
                    return;
                case 'delete_character_confirm':
                    await player.remove(userId);
                    
                    const embed = new EmbedBuilder()
                        .setColor('F08080')
                        .setAuthor({name: 'Your character has been deleted.'})
                        .setDescription('You can create a new one with the t.begin command.')

                    interaction.update({embeds: [embed], components: []});
                    return;
                case 'buyItem':

                    if(args[0] != interaction.user.id) {
                        interaction.channel.send("Eğer kendi karakterinle birşeyler satın almak istiyorsan `mshop` komutunu kendin kullanabilirsin ! " + "<@" + interaction.user.id + ">");
                        return;
                    }

                    if (interaction.message.components[1] != undefined) {
                        interaction.channel.send("Lütfen bir eşya ve adet seçiniz! " + "<@" + interaction.user.id + ">");
                        await interaction.message.delete(); 
                        return;
                    }

                    var currentQuantity = interaction.message.components[0].components[0].customId.split('-')[4];
                    var currentItem = interaction.message.components[0].components[0].customId.split('-')[3];
                    var shop = interaction.message.components[0].components[0].customId.split('-')[2];
                    var currentType = shopsData[shop].items[currentItem].type;
                    var currentID = shopsData[shop].items[currentItem].id;

                    if(currentType == "weapon" || currentType == "chestplate" || currentType == "helmet" || currentType == "boots"){
                        const equipment = equip.get(currentID, currentType);

                        if(equipment == null) {
                            console.log("ERROR: Tried to give an equip that doesn't exist.");
                            return false;
                        }
                    
                        const playerCollection = Client.mongoDB.db('player-data').collection(interaction.user.id);
                    
                        const query = { name: "inventory" };
                        const options = { 
                            projection: {equipItems: 1},
                            upsert: true,
                        };
                    
                        const inv = await playerCollection.findOne(query, options);
                        const filter = inv.equipItems.filter(item => item.type == currentType);
                        filter.filter(item => item.type == currentType);
                    
                        if(filter.length > 0) {
                            interaction.channel.send("Bu ekipmana zaten sahipsin! " + "<@" + interaction.user.id + ">");
                            await interaction.message.delete(); 
                            break;
                        }
                    }

                    var buy = await player.takeMoney(interaction.user.id, shopsData[shop].items[currentItem].cost * currentQuantity, interaction.message);

                    if(!buy) {
                        await interaction.message.delete(); 
                        selector.generateShopItemsSelector(interaction, shop, "0", "0");
                        break;
                    }
                
                    if(currentType == "weapon" || currentType == "chestplate" || currentType == "helmet" || currentType == "boots"){
                    await inventory.buyEq(interaction.user.id, currentID, currentType);
                    }else {
                    await inventory.giveItem(interaction.user.id, currentItem, currentQuantity);
                    }

                    if(currentQuantity == 1){
                      var boughtQuantity = "";
                    }else{
                      var boughtQuantity = currentQuantity + " adet ";
                    }
                    interaction.channel.send(boughtQuantity + shopsData[shop].items[currentItem].name + " başarıyla satın alındı! " + "<@" + interaction.user.id + ">");

                    await interaction.message.delete(); 
                return;
                default:
                    break;
            }

            if(buttons.has(command)) {
                buttons.get(command).interact(interaction, args);
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error while executing this button!', ephemeral: true });
        }
    }
}