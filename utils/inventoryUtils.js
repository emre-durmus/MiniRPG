const { Client, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const player = require('../utils/playerUtils.js');
const classData = require('../data/classes.json');
const { calculateExpToNextLevel, calculateExpPercentage } = require('../utils/rpgInfoUtils.js');
const equip = require('./equipUtils.js');
const ability = require('./abilityUtils.js');


exports.getInventoryString = function(inventory) {
    let rawdata = fs.readFileSync('./data/items.json');
    let items = JSON.parse(rawdata);

    if(inventory == undefined)
        return "ERROR_UNDEFINED_INVENTORY";

    var inventoryDisplay = "";
    if(Object.keys(inventory).length != 0)
        try {
            for(const [key, value] of Object.entries(inventory)) {
                inventoryDisplay += `${items[key].name} (x${value.quantity})\n`;
            }
            return inventoryDisplay;
        } catch(err) {
            console.log(err);
            return "ERROR_UNDEFINED_ITEM";
        }
    else
        return "Vide";
}

/**
 * Adding an item to the inventory of a player or increasing the quantity of an existing item
 * @param playerId id of the player
 * @param {*} item item to give
 * @param {*} quantity quantity of the item to give
 */
exports.giveItem = async function(playerId, item, quantity, channel) {
    const playerCollection = Client.mongoDB.db('player-data').collection(playerId);

    // Querying the inventory in the database
    const inventory = await playerCollection.findOne(
        {name: "inventory"}, 
        {projection: {_id: 0, abilities: 0, activeAbilities: 0, stats: 0, equipment: 0}}
    );
    
    // If the item is already in the inventory, we add the quantity to the existing one
    // Else, we create a new entry for the item
    if(inventory.items[item] != undefined) {
        var int1 = parseInt(quantity);
        var int2 = parseInt(inventory.items[item].quantity);
        var int3 = int1 + int2;
        inventory.items[item].quantity = int3;
    } else {
        inventory.items = {
            ...inventory.items,
            [item]: {
                quantity: quantity
            }
        }
    }

    // Updating the inventory in the database
    playerCollection.updateOne({name: "inventory"}, { $set: { items: inventory.items } }, { upsert: true });

    if(channel != undefined) {
        const embed = new EmbedBuilder()
            .setDescription(`<@${playerId}> received ${quantity} ${item}!`)
            .setColor(0xFFFFFF);

        channel.send({ embeds: [embed] });
    }

    console.groupCollapsed("Item Given");
    console.log(`Given to: ${playerId}`);
    console.log(`Item: ${item}`);
    console.log(`Quantity: ${quantity}`);
    console.groupEnd();
}

exports.giveEquipment = async function(playerId, equipment, quantity) {
    const playerCollection = Client.mongoDB.db('player-data').collection(playerId);

    // Querying the inventory in the database
    const inventory = await playerCollection.findOne(
        {name: "inventory"},
        {projection: {equipItems : 1}}
    );

    // If the item is already in the inventory, we add the quantity to the existing one
    // Else, we create a new entry for the item
    if(inventory.equipItems[equipment] != undefined) {
        var int1 = parseInt(quantity);
        var int2 = parseInt(inventory.equipItems[equipment].quantity);
        var int3 = int1 + int2;
        inventory.equipItems[equipment].quantity = int3;
    } else {
        inventory.equipItems = {
            ...inventory.equipItems,
            [equipment]: {
                quantity: 1
            }
        }
    }

    // Updating the inventory in the database
    playerCollection.updateOne({name: "inventory"}, { $set: { equipItems: inventory.equipItems  } }, { upsert: true });

    console.groupCollapsed("Equipment Given");
    console.log(`Given to: ${playerId}`);
    console.log(`Equipment: ${equipment}`);
    console.groupEnd();

    return inventory.equipItems[equipment].quantity;
}

exports.buyEq = async function(playerId, equipId, type) {
    const equipment = equip.get(equipId, type);

    if(equipment == null) {
        console.log("ERROR: Tried to give an equip that doesn't exist.");
        return false;
    }

    const playerCollection = Client.mongoDB.db('player-data').collection(playerId);

    const query = { name: "inventory" };
    const options = { 
        projection: {equipItems: 1},
        upsert: true,
    };

    const inv = await playerCollection.findOne(query, options);

    equipment.type = type;

    inv.equipItems.push(equipment);

    const update = { $set: { equipItems: inv.equipItems }};


    playerCollection.updateOne(query, update, options);

    console.log("[DEBUG] " + equipment.name + " added to " + playerId + "'s inventory.");
}

exports.display = async function(player, interaction, type, ack) {
    let embed = new EmbedBuilder();
    const playerId = player.id;
    embed.setAuthor({name: player.username, iconUrl: interaction.user.avatarURL})
    .setThumbnail(interaction.user.displayAvatarURL());
    const componentList = [];

    const row = new ActionRowBuilder();
    row.addComponents(addSlider(playerId));
    componentList.push(row);
    const buttons = new ActionRowBuilder();

    switch(type) {
        case "items":
            embed = (await typeItems(embed, playerId)).embed;
            break;
        case "abilities":
            ret = (await typeAbilities(embed, playerId, player.username));
            embed = ret.embed;
            buttons.addComponents(ret.components);
            break;
        case "stats":
            embed = (await typeStats(embed, playerId)).embed;
            break;
        case "equipment":
            ret = (await typeEquipment(embed, playerId, player.username));
            embed = ret.embed;
            buttons.addComponents(ret.components);
            break;
        default:
            embed = (await typeMain(embed, playerId)).embed;
            break;
    }

    try {
        if(buttons.components.length > 0)
            componentList.push(buttons);

        //console.log(buttons);
        interaction.message.edit({ embeds: [embed], components: componentList});
        if(ack)
            interaction.deferUpdate();
    } catch(err) {
        console.log(err);
    }
    
}

exports.typeMain = typeMain;
async function typeMain(embed, playerId) {
    const playerInfo = await player.getData(playerId, "info");
    const playerStats = await player.getData(playerId, "stats");
    const playerStory = await player.getData(playerId, "story");

     // Experience progress bar
     var expBar = "";
     var expToNextLevel = calculateExpToNextLevel(playerInfo.level);
     var expBarLength = Math.floor((playerInfo.exp / expToNextLevel) * 10);
     for(var i = 0; i < expBarLength; i++) {
         expBar += "▰";
     }
     for(var i = expBarLength; i < 10; i++) {
         expBar += "▱";
     }

     var energyBar = "";
     for(var i = 0; i < playerInfo.energy; i++) {
            energyBar += "▰";
    } 
    for(var i = 0; i < 3-playerInfo.energy ; i++) {
        energyBar += "▱";
    }


    const percHealth = Math.round((playerInfo.health / playerInfo.max_health)*100);
    const percExp = Math.floor(playerInfo.exp/expToNextLevel*100);

    const skillTypes = JSON.parse(fs.readFileSync("./data/skillTypes.json", "utf8"))[playerInfo.class];
    const skillType = playerInfo.skillType;
    let charSkillType = "Yok";
    if(skillType != undefined){
      charSkillType = skillTypes[skillType].name;
    }
  
    const zone = JSON.parse(fs.readFileSync('./data/zones.json'))[playerStory.location.zone];
    if(zone == undefined)
        var zoneName = playerStory.location.zone;
    else
        var zoneName = zone.name;

    embed.addFields(
        { name: 'HP', value: `${playerInfo.health}/${playerInfo.max_health} (${percHealth}%)`, inline: true },
        { name: 'Sınıf', value: classData[playerInfo.class].name, inline: true },
        { name: 'Eğitim', value: charSkillType, inline: true },
        { name: 'Level ' + playerInfo.level, value: "Exp: " + playerInfo.exp + "/" + expToNextLevel + ` (${percExp}%)` +"\n" + expBar },
        //{ name: 'Energy', value: energyBar },
        { name: 'Para', value: playerInfo.money + ' yang' , inline: true},
        { name: 'Bölge', value: zoneName }
    );

    return {embed: embed};
}

exports.typeItems = typeItems;
async function typeItems(embed, playerId) {
    inventory = await player.getData(playerId, "inventory");

    if(Object.keys(inventory.items).length == 0) {
        embed.setDescription("Envanterin boş.");
        return {embed: embed};
    }

    // Reading the items
    let rawdata = fs.readFileSync('./data/items.json');
    let items = JSON.parse(rawdata);

    let description = "";

    for (const [key, value] of Object.entries(inventory.items)) {
        description += `${items[key].name} (x${value.quantity}),`;
    }

    if(description == "")
        description = "Empty,";

    description = description.slice(0, -1);

    embed.setDescription(description);

    return {embed: embed};
} 

exports.typeStats = typeStats;
async function typeStats(embed, playerId) {
    playerStats = await player.getData(playerId, "stats");
    playerEquip = await player.getEquiped(playerId);

    embed.addFields(
        {name: "Canlılık(VIT)", value: playerStats.vitality + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_vit")})`, inline: false},
      {name: "Zeka(INT)", value: playerStats.intelligence + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_int")})`, inline: true},
      //{name: "Çeviklik(AGI)", value: playerStats.agility + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_agi")})`, inline: true},
       //{name: "Dayanıklılık(RES)", value: playerStats.resistance + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_res")})`, inline: true},
    )
    .addFields(
        {name: "Güç(STR)", value: playerStats.strength + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_str")})`, inline: false},
       {name: "Çeviklik(DEX)", value: playerStats.spirit + ` (+${equip.stat.getCombined(playerEquip, "raw_buff_dex")})`, inline: true},
    );

    return {embed: embed};
}

exports.typeAbilities = typeAbilities;
async function typeAbilities(embed, playerId, playername) {
    var data = JSON.parse(fs.readFileSync('./data/abilities.json'));
    const playerData = await player.getData(playerId, "inventory");
    const abilities = playerData.abilities.sort((a, b) => (data[a].number > data[b].number) ? 1 : -1);
    const activeAbilities = playerData.activeAbilities.sort((a, b) => (data[a].number > data[b].number) ? 1 : -1);

    embed.setTitle(`${playername} Yetenekleri`)
         .setFooter({text: 'Yeteneğin hakkında daha fazla şey mi öğrenmek istiyorsun? `mskill "yetenek numarası"` yazarak ulaşabilirsin'})

    try {
        embed.setDescription(abilities.length != 0 ? abilities.map(ability => `\ ${data[ability].number} - ${data[ability].name}`).join("\n ") : "Herhangi bir yeteneğin yok.");
    } catch (error) {
        embed.setDescription("Herhangi bir yeteneğin yok. (Bir hata olabilir!)");
        console.error(error);
    }

    try {
        embed.addFields({name: "Aktif Yetenekler", value: ability.getStingActiveAbilities(activeAbilities)});
    } catch (error) {
        console.error(error);
        embed.addFields({name: "Aktif Yetenekler", value: "No active ability. (There may be an error!)"});
    }

    return {embed: embed, components: sendButtonAbility(playerId, abilities.length != 0, activeAbilities.length != 0)};
}

exports.typeEquipment = typeEquipment;
async function typeEquipment(embed, playerId) {
    const playerData = await player.getData(playerId, "inventory");
    const equipment = playerData.equiped;

    embed = await equip.getDisplay(playerId, embed, equipment );

    const components = [];
    components.push(
            makeButton("Ekipman Giy", "equip-equip"),
            makeButton("Çıkar", "equip-unequip"),
            makeButton("Tümünü Göster"  , "equip-list"));

    return {embed: embed, components: components};
}

function sendButtonAbility(userId, abilityEnable, activeAbilityEnable) {
    const components = [];
    components.push(
        new ButtonBuilder()
            .setCustomId("selectAbility-" + userId)
            .setLabel("Yetenek Kullan")
            .setStyle("Secondary")
            .setDisabled(!abilityEnable)
    )
    components.push(
        new ButtonBuilder()
            .setCustomId("unselectAbility-" + userId)
            .setLabel("Yeteneği Çıkar")
            .setStyle("Secondary")
            .setDisabled(!activeAbilityEnable),
    );

    return components;
}

exports.addSlider = addSlider;
function addSlider(playerId) {    
    const invSelector = new StringSelectMenuBuilder()
        .setCustomId('inventory_selector-' + playerId)
        .setPlaceholder('Herhangi bir şey seçilmedi')
            .addOptions(
                [
                    {label: "Karakter", value: "main", description: "Karakterin durumunu göster!"},
                    {label: "Envanter", value: "items", description: "Envanterini görüntüle!"},
                    {label: "Yetenekler", value: "abilities", description: "Karakterinin skillerini gösterir!"},
                    {label: "Statü", value: "stats", description: "Karakterin statülerini görüntüle!"},
                    {label: "Ekipmanlar", value: "equipment", description: "Üzerindeki eşyaları düzenle!"},
                ]
        )

    return invSelector;
}

function makeButton(name, id) {
    return new ButtonBuilder()
        .setCustomId(id)
        .setLabel(name)
        .setStyle(ButtonStyle.Secondary);
}