const { Client, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const util = require('../utils/combatUtils.js');
const embed = require('../utils/messageTemplateUtils.js');
const playerUtils = require('../utils/playerUtils.js');
const equip = require('../utils/equipUtils.js');
const passives = require('../utils/combat/passiveUtil.js');

/**
 * Instanciates a combat in the database, note that the data is currently blank.
 * @param message message whose id will serve as the combat id. also is the id of the thread.
 * @returns the id in question.
 */

exports.addFirstPlayerToCombat = async function(playerDiscord, combatId, team, interaction) {
    const playerId = playerDiscord.id;
    const combatCollection = Client.mongoDB.db('combat-data').collection(combatId);
    let info = await util.getCombatCollection(combatId);

    if (info == null) {
        console.log("[DEBUG] Attempted to join a non-existent combat. (NON_EXISTENT_COMBAT_JOIN_ATTEMPT)");
        interaction.deferUpdate();
        return;
    }
    if(team != 1 && team != 2) {
        console.log("[DEBUG] Attempted to join a non-existent team. (NON_EXISTENT_TEAM_JOIN_ATTEMPT)");
        interaction.deferUpdate();
        return;
    }

    if(util.getPlayerInCombat(playerId, info) != null) {
        console.log("[DEBUG] Attempted to join a combat with an already existing player. (ALREADY_EXISTING_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Zaten bu savaşa katıldın!", ephemeral: true});
        return;
    }

    playerCollection = Client.mongoDB.db('player-data').collection(playerId);
    const playerInfo = await playerCollection.findOne({ name: "info" }, { _id: 0 });

    if(playerInfo.state.name != "idle") {
        console.log("[DEBUG] Attempted to join a combat with a non-idle player. (NON_IDLE_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Karakterin zaten bir savaşta! Öncelikle o savaşını bitirmelisin.", ephemeral: true});
        return;
    }
    if(playerInfo.health <= 0) {
        console.log("[DEBUG] Attempted to join a combat with a dead player. (DEAD_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Karakterin ölü! Birinci köye giderek tekrar doğabilirsin.", ephemeral: true});
        return; 
    }
    console.log(playerInfo.health);

    const playerStats = await playerCollection.findOne({ name: "stats" }, { _id: 0 });
    const playerInv = await playerCollection.findOne({ name: "inventory" }, { _id: 0 });
    const playerMisc = await playerCollection.findOne({ name: "misc" }, { _id: 0 });
    const playerEquip = playerInv.equiped;

    if(playerMisc.party.owner != info.creator) {
        console.log("[DEBUG] Attempted to join a combat with a non-party member. (NON_PARTY_MEMBER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Savaşı başlatanla aynı grupta değilsiniz! (mgrup ekle @Kullanici) yazarak davet gönderebilirsin.", ephemeral: true});
        return;
    }

    const player = {
        id: playerId,
        name: playerDiscord.username,
        type: "human",
        class: playerInfo.class,
        health: playerInfo.health,
        max_health: playerInfo.max_health,
        timeline: 0,
        stats: {
            vitality: playerStats.vitality + equip.stat.getCombined(playerEquip, "raw_buff_vit"),
            strength: playerStats.strength + equip.stat.getCombined(playerEquip, "raw_buff_str"),
            spirit: playerStats.spirit + equip.stat.getCombined(playerEquip, "raw_buff_spi"),
            resistance: playerStats.resistance + equip.stat.getCombined(playerEquip, "raw_buff_res"),
            intelligence: playerStats.intelligence + equip.stat.getCombined(playerEquip, "raw_buff_int"),
            agility: playerStats.agility + equip.stat.getCombined(playerEquip, "raw_buff_agi"),
        },
        equipment: {},
        effects: {},
        abilities: playerInv.activeAbilities,
        items: playerInv.items,
    }

    util.setInitialPassives(player);

    team == 1 ? info.team1.push(player) : info.team2.push(player); // Adds a player to their corresponding team.

    const update = {
        $set: {
            current_turn: 1,
            team1: info.team1,
            team2: info.team2,
        }
    };

    util.updateMainMessage(info, interaction, "prebattle");

    await combatCollection.updateOne({}, update, { upsert: true });
    await playerCollection.updateOne({ name: "info" }, { $set: { state: {name: "in-combat", combatid: combatId} } }, { upsert: true });

    //interaction.deferUpdate();
    console.log("[DEBUG] " + playerId + " joined combat " + combatId);
}

exports.addPlayerToCombat = async function(playerDiscord, combatId, team, interaction) {
    const playerId = playerDiscord.id;
    let message = interaction.message;
    const combatCollection = Client.mongoDB.db('combat-data').collection(combatId);
    let info = await util.getCombatCollection(combatId);

    if (info == null) {
        console.log("[DEBUG] Attempted to join a non-existent combat. (NON_EXISTENT_COMBAT_JOIN_ATTEMPT)");
        interaction.deferUpdate();
        return;
    }
    if(team != 1 && team != 2) {
        console.log("[DEBUG] Attempted to join a non-existent team. (NON_EXISTENT_TEAM_JOIN_ATTEMPT)");
        interaction.deferUpdate();
        return;
    }

    if(util.getPlayerInCombat(playerId, info) != null) {
        console.log("[DEBUG] Attempted to join a combat with an already existing player. (ALREADY_EXISTING_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Zaten bu savaşa katıldın!", ephemeral: true});
        return;
    }

    playerCollection = Client.mongoDB.db('player-data').collection(playerId);
    const playerInfo = await playerCollection.findOne({ name: "info" }, { _id: 0 });

    if(playerInfo.state.name != "idle") {
        console.log("[DEBUG] Attempted to join a combat with a non-idle player. (NON_IDLE_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Karakterin zaten bir savaşta! Öncelikle o savaşını bitirmelisin.", ephemeral: true});
        return;
    }
    if(playerInfo.health <= 0) {
        console.log("[DEBUG] Attempted to join a combat with a dead player. (DEAD_PLAYER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Karakterin ölü!", ephemeral: true});
        return; 
    }
    console.log(playerInfo.health);

    const playerStats = await playerCollection.findOne({ name: "stats" }, { _id: 0 });
    const playerInv = await playerCollection.findOne({ name: "inventory" }, { _id: 0 });
    const playerMisc = await playerCollection.findOne({ name: "misc" }, { _id: 0 });
    const playerEquip = playerInv.equiped;

    if(playerMisc.party.owner != info.creator) {
        console.log("[DEBUG] Attempted to join a combat with a non-party member. (NON_PARTY_MEMBER_JOIN_ATTEMPT)");
        interaction.reply({ content:"Savaşı başlatanla aynı grupta değilsiniz! (mgrup ekle @Kullanici) yazarak davet gönderebilirsin.", ephemeral: true});
        return;
    }

    const player = {
        id: playerId,
        name: playerDiscord.username,
        type: "human",
        class: playerInfo.class,
        health: playerInfo.health,
        max_health: playerInfo.max_health,
        timeline: 0,
        stats: {
            vitality: playerStats.vitality + equip.stat.getCombined(playerEquip, "raw_buff_vit"),
            strength: playerStats.strength + equip.stat.getCombined(playerEquip, "raw_buff_str"),
            spirit: playerStats.spirit + equip.stat.getCombined(playerEquip, "raw_buff_spi"),
            resistance: playerStats.resistance + equip.stat.getCombined(playerEquip, "raw_buff_res"),
            intelligence: playerStats.intelligence + equip.stat.getCombined(playerEquip, "raw_buff_int"),
            agility: playerStats.agility + equip.stat.getCombined(playerEquip, "raw_buff_agi"),
        },
        equipment: {},
        effects: {},
        abilities: playerInv.activeAbilities,
        items: playerInv.items,
    }

    util.setInitialPassives(player);

    team == 1 ? info.team1.push(player) : info.team2.push(player); // Adds a player to their corresponding team.

    const update = {
        $set: {
            current_turn: 1,
            team1: info.team1,
            team2: info.team2,
        }
    };

    util.updateMainMessage(info, message, "prebattle");

    await combatCollection.updateOne({}, update, { upsert: true });
    await playerCollection.updateOne({ name: "info" }, { $set: { state: {name: "in-combat", combatid: combatId} } }, { upsert: true });

    interaction.deferUpdate();
    console.log("[DEBUG] " + playerId + " joined combat " + combatId);
}

exports.instanciateCombat = async function(orderMessage, creator) {
    const channel = orderMessage.channel;

    // Check if the channel is a thread
    if(channel.isThread()) {
        console.log("[ERROR] Tried to instanciate a combat in a thread channel.");
        orderMessage.reply("Burada bir savaş başlatamazsın").then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
        return;
    }


    const playerInfo = await playerUtils.getData(creator.id, "info");
    const playerStory = await playerUtils.getData(creator.id, "story");

    if(playerInfo == null) {
        console.log("[ERROR] Tried to instanciate a combat with a non-existent player.");
        return;
    }

    if(playerInfo.energy <= 0) {
        console.log("[ERROR] Tried to instanciate a combat with 0 energy.");
        orderMessage.reply("You don't have enough energy to start a combat.").then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
        return;
    }

    if(playerInfo.state.name != "idle") {
        orderMessage.reply("Karakterin zaten bir savaşta! Öncelikle o savaşını bitirmelisin.").then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
        return;
    }
    
    const party = (await playerUtils.getData(creator.id, "misc")).party;

    if(party == null || party.owner != creator.id) {
        console.log("[ERROR] Tried to instanciate a combat with a non-existent party.");
        orderMessage.reply("Grup lideri değilsin.").then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
        return;
    }
    
    const playerZone = JSON.parse(fs.readFileSync('./data/zones.json', 'utf8'))[playerStory.location.zone];

    if(playerZone == null) {
        console.log("[ERROR] Tried to instanciate a combat in a non-existent location.");
        return;
    }
    if(playerZone.monsters == null || Object.values(playerZone.monsters).length == 0) {
        console.log("[ERROR] Tried to instanciate a combat in a location with no monsters.");
        orderMessage.reply("Bu alanda düşman yok.").then(msg => {
            setTimeout(() => {
                msg.delete()
                orderMessage.delete();
            }, 2000);
        });
        return;
    }


    /*orderMessage.reply("Canavarla karşılaştın!").then(msg => {
        setTimeout(() => msg.delete(), 5000);
    });

    playerUtils.energy.add(creator.id, -1);*/

    const searchEmbed = new EmbedBuilder()
        .setTitle("Canavar aranıyor...")

    const message = await channel.send({ embeds: [searchEmbed] });
    const messageId = message.id;

    await util.createThread(message);
    
    const combatCollection = Client.mongoDB.db('combat-data').collection(messageId);
    const combatData = [
        {
            zone: playerStory.location.zone,
            type: 'wild-encounter',
            creator: creator.id,
            current_turn: 0,
            current_timeline: 0,
            current_action: {
                current_player_id: null,
                current_player_team: null,
                aim_at: null,
                ability: null,
            },
            team1: [],
            team2: [],
        }
    ];

    await combatCollection.insertMany(combatData, { ordered: true});
    await embed.sendEncounterMessage(message, 'wild-encounter');
    orderMessage.delete();
    await this.addFirstPlayerToCombat(creator, messageId, "1", message);
    return messageId;
}


exports.deleteCombat = async function(channel) {
    const combatCollection = Client.mongoDB.db('combat-data').collection(channel.id);
    const combatData = await util.getCombatCollection(channel.id);

    if(combatData == null || combatData == undefined || combatData.team1 == null || combatData.team2 == null) {
        console.log("[DEBUG] Attempted to delete a non-existent combat. (NON_EXISTENT_COMBAT_DELETE_ATTEMPT)");
        return;
    }

    for(player of combatData.team1.concat(combatData.team2)) {
        if(player.type == "human") {
            playerUtils.setState(null, player.id, {name: "idle"});
        }
    }

    try {
        util.updateMainMessage(combatData, await channel.fetchStarterMessage(), "cancelled");
    } catch (error) {
        console.log("[ERROR] Tried to update a non-existent main message.");
    }
    
    util.deleteThread(channel);

    await combatCollection.drop(function(err, res) {
        if (err) throw err;
        if (res) console.log("[DEBUG] Combat " + channel.id + " deleted.");
    });
}

/**
 * Deletes the combat from the databaes, but do not interfere with the thread or the origin message.
 * @param {*} channelId the combat id to delete.
 */
exports.softDeleteCombat = async function(channelId) {
    const combatCollection = Client.mongoDB.db('combat-data').collection(channelId);
    const combatData = await util.getCombatCollection(channelId);

    if(combatData == null) {
        console.log("[DEBUG] Attempted to delete a non-existent combat. (NON_EXISTENT_COMBAT_DELETE_ATTEMPT)");
        return;
    }

    for(player of combatData.team1.concat(combatData.team2)) {
        if(player.type == "human") {
            playerUtils.setState(null, player.id, {name: "idle"});
        }
    }

    await combatCollection.drop(function(err, res) {
        if (err) throw err;
        if (res) console.log("[DEBUG] Combat " + channelId + " deleted.");
    });
}

exports.removePlayerFromCombat = async function(playerId, combatId, interaction) {
    let message = interaction.message;
    const combatCollection = Client.mongoDB.db('combat-data').collection(combatId);
    let info = await util.getCombatCollection(combatId);

    if (info == null) {
        console.log("[DEBUG] Attempted to leave a non-existent combat. (NON_EXISTENT_COMBAT_LEAVE_ATTEMPT)");
        return;
    }

    if(util.getPlayerInCombat(playerId, info) == null) {
        console.log("[DEBUG] Attempted to leave a combat with a non-existing player. (NON_EXISTING_PLAYER_LEAVE_ATTEMPT)");
        interaction.reply({ content:"Karakterin savaşta değil!", ephemeral: true});
        return;
    }

    if(info.current_action.current_player_id != null) {
        console.log("[DEBUG] Attempted to leave a combat with a player in the middle of an action. (PLAYER_IN_ACTION_LEAVE_ATTEMPT)");
        interaction.reply({ content:"Savaş zaten başladı!", ephemeral: true});
    }

    playerCollection = Client.mongoDB.db('player-data').collection(playerId);
    const playerInfo = await playerCollection.findOne({ name: "info" }, { _id: 0 });

    if(playerInfo.state.name != "in-combat") {
        console.log("[DEBUG] Attempted to leave a combat with a non-in-combat player. (NON_IN_COMBAT_PLAYER_LEAVE_ATTEMPT)");
        interaction.reply({ content:"Karakterin savaşta değil!", ephemeral: true});
        return;
    }

    if(playerInfo.state.combatid != combatId) {
        console.log("[DEBUG] Attempted to leave a combat with a player in another combat. (PLAYER_IN_OTHER_COMBAT_LEAVE_ATTEMPT)");
        interaction.reply({ content:"Karakterin savaşta değil!", ephemeral: true});
        return;
    }

    info.team1 = info.team1.filter(player => player.id != playerId);
    info.team2 = info.team2.filter(player => player.id != playerId);

    const update = {
        $set: {
            current_turn: 1,
            team1: info.team1,
            team2: info.team2,
        }
    };

    util.updateMainMessage(info, message, "prebattle");

    await combatCollection.updateOne({}, update, { upsert: true });

    await playerCollection.updateOne({ name: "info" }, { $set: { state: {name: "idle"} } }, { upsert: true });

    interaction.deferUpdate();
}

exports.searchForMonsters = async function(interaction, combat) {
    var bestPlayer;

    for(player of combat.team1) {
        if(bestPlayer == null) {
            bestPlayer = player;
        } else {
            if(player.max_health > bestPlayer.max_health) {
                bestPlayer = player;
            }
        }
    }

    bestPlayer = await playerUtils.getData(bestPlayer.id, "info");

    var zone = JSON.parse(fs.readFileSync('./data/zones.json'))[combat.zone]; // Gets the zone data from the JSON file.

    if(zone == null) {
        console.log("[DEBUG] Attempted to spawn monsters in a non-existent zone. (NON_EXISTENT_ZONE_SPAWN_ATTEMPT)");
        return false;
    }

    var monsters = Object.values(zone.monsters);

    if(monsters == null || monsters == undefined || monsters.length == 0) {
        console.log("[DEBUG] Attempted to spawn monsters in a zone with no monsters. (ZONE_WITH_NO_MONSTERS_SPAWN_ATTEMPT)");
        return false;
    }

    for(var m in monsters) {
        if(monsters[m].min_level != undefined && monsters[m].min_level > bestPlayer.level) {
            monsters.splice(m, 1);
        }
    }

    var maxRange = 0;
    for (var i in monsters) {
        maxRange += parseInt(monsters[i]["spawn-chance"]);
    }

    var random = Math.floor(Math.random() * maxRange) + 1;

    var currentRange = 0;
    for (var i in monsters) {
        currentRange += parseFloat(monsters[i]["spawn-chance"]);
        if (random <= currentRange) {
            for(var j in monsters[i]["m-names"]) {
                combat = await exports.addEntityToCombat(interaction.channel, monsters[i]["m-names"][j]);
            }
            break;
        }
    }

    const startMessage = await interaction.channel.fetchStarterMessage();
    util.updateMainMessage(combat, startMessage, "battle");

    if(combat.team2.length == 0) {
        return false;
    }

    return combat;
}

exports.addEntityToCombat = async function(thread, entity) {
    let combatId = thread.id;
    let combatCollection = await util.getCombatCollection(combatId);

    if (combatCollection == null) {
        console.log("[DEBUG] Attempted to join a non-existent combat. (NON_EXISTENT_COMBAT_JOIN_ATTEMPT)");
        return;
    }

    combatCollection = Client.mongoDB.db('combat-data').collection(combatId);

    const info = await combatCollection.findOne({}, { _id: 0 });

    const dummy = util.createMonsterData(info, entity);

    info.team2.push(dummy);

    const update = {
        $set: {
            current_turn: 1,
            team2: info.team2,
        }
    };

    await combatCollection.updateOne({}, update, { upsert: true });

    console.log("[DEBUG] " + entity + " joined combat " + combatId); 

    return info;
}

exports.startCombat = async function(interaction) {
    let thread = interaction.channel;
    let combatId = thread.id;
    let combatData = await util.getCombatCollection(combatId);

    if(!thread.isThread()) {
        console.log("[DEBUG] Attempted to start a non-thread channel. (NON_THREAD_CHANNEL_START_ATTEMPT)");
        return;
    }

    if (combatData == null) {
        console.log("[DEBUG] Attempted to start a non-existent combat. (NON_EXISTENT_COMBAT_START_ATTEMPT)");
        return;
    }

    if(combatData.creator != interaction.user.id) {
        console.log("[DEBUG] Non-created attempted to start a combat. (NON_CREATOR_COMBAT_START_ATTEMPT)");
        interaction.reply({ content: "Sadece grup lideri savaşı başlatabilir! (mgrup ayril) yazarak gruptan ayrılabilirsin.", ephemeral: true });
        return;
    }

    // Checks if the combat has enough players. For PVE, it will add monsters.
    switch(combatData.type) {
        case "wild-encounter":
            if(combatData.team1.length == 0) {
                console.log("[DEBUG] Attempted to start a combat with no players. (COMBAT_WITH_NO_PLAYERS_START_ATTEMPT)");
                interaction.reply({ content: "Takımında en az 1 kişi olmalı!", ephemeral: true });
                return;
            }
            const ret = await exports.searchForMonsters(interaction, combatData);
            if(ret == false)
                return;
            combatData = ret;
            break;
        case "pvp":
            if (combatData.team1.length == 0 || combatData.team2.length == 0) {
                console.log("[DEBUG] Attempted to start a combat with less than 2 players. (COMBAT_WITH_LESS_THAN_2_PLAYERS_START_ATTEMPT)");
                interaction.reply({ content: "Takımlarda en az 1 kişi olmalı", ephemeral: true });
                return;
            }
            break;
        default:
            console.log("[DEBUG] Attempted to start a combat with an unknown type. (COMBAT_WITH_UNKNOWN_TYPE_START_ATTEMPT)");
            return;
    }

    interaction.message.delete();

    exports.combatLoop(thread, combatData);
}

exports.combatLoop = async function(thread, combatData) {
    const soonestFighter = util.getSoonestTimelineEntity(combatData);
    const exeData = {
        combat: combatData,
    }

    this.updateEffects(soonestFighter, "before", exeData, thread);

    if(soonestFighter.type == "human") {
        await new Promise(r => setTimeout(r, 1700));
        combatData.current_action.current_player_id = soonestFighter.id;
        combatData.current_action.aim_at = null;
        combatData.current_action.ability = null;
        util.sendAbilitySelector(soonestFighter, thread);
        console.log("[DEBUG] This is the player's turn. Waiting for player input.");
    } else {
        console.log("[DEBUG] This is the monster's turn. Simulating a turn.");
        await new Promise(r => setTimeout(r, 1700));
        await util.executeMonsterAttack(combatData, thread, soonestFighter.id);
    }

    combatData.current_turn++;

    const update = {
        $set: {
            current_turn: combatData.current_turn,
            current_action: combatData.current_action,
        }
    };

    combatCollection = Client.mongoDB.db('combat-data').collection(thread.id);

    await combatCollection.updateOne({}, update, { upsert: true });
}

exports.finishTurn = async function(exeData) {
    const { combat, thread, casterId, targetId, ability, log } = exeData;
    const caster = util.getPlayerInCombat(casterId, combat);
    const target = util.getPlayerInCombat(targetId, combat);
    let embed = new EmbedBuilder();

    this.updateEffects(caster, "after", exeData, thread);

    if(caster.type == "human") {
        const user = await Client.client.users.fetch(caster.id);
        const avatar = "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png";
        embed.setAuthor({ name: caster.name + ", " + ability.name + " kullandı !", iconURL: avatar });
    } else {
        embed.setAuthor({ name: caster.name + ", " + ability.name + " kullandı !" });
    }

    let hasDied = false;

    for(player of log) {
        if(util.log.print(embed, player, util.getPlayerInCombat(player.id, combat)) == true) {
            hasDied = true;
        }
    }

    thread.send({ embeds: [embed] });

    if(hasDied) {
        const alive = util.checkForVictory(combat);
        if(alive != 0) {
            this.callForVictory(combat, thread, alive);
            return;
        }
    } 
    this.combatLoop(thread, combat);
}

exports.updateEffects = function(player, situation, exeData, thread) {
    const { combat } = exeData;
    var update = false;

    //console.log(Object.values(player.effects));
    //console.log(Object.keys(player.effects));

    for (const [key, value] of Object.entries(player.effects)) {
        if(situation != value.situation) {
            continue;
        }

        //console.log("Effect: " + key + " | Situation: " + value.situation + " | Proc: " + value.proc + " | Value: " + value.value);

        update = true;

        for(const passive of Object.values(passives)) {
            if(passive.id == key) {
                passive.proc(exeData, player, value);
            }
        }

        if(player.effects[key].duration != undefined) {
            player.effects[key].duration--;
            if (player.effects[key].duration <= 0) {
                if(player.effects[key].onEnd != undefined) {
                    player.effects[key].onEnd(exeData, player, value);
                }
                delete player.effects[key];
            }
            continue;
        }
    }

    if(!update) {
        return;
    }

    if(combat.team1.includes(player)) {
        combat.team1[combat.team1.indexOf(player)] = player;
    }

    if(combat.team2.includes(player)) {
        combat.team2[combat.team2.indexOf(player)] = player;
    }



    util.updateTeamData(thread, combat, combat.team1, combat.team2);
    
    /*if(Object.keys(player.effects).length > 0) {
        for(var i = 0; i < Object.keys(player.effects).length; i++) {
            if(player.effects[Object.keys(player.effects)[i]].proc.split('-')[0] == 'damage') {
                if(situation == "after") {
                    if(player.effects[Object.keys(player.effects)[i]].proc.split('-')[1] == 'after') {
                        console.log("Damage effect: " + player.effects[Object.keys(player.effects)[i]].value);
                        player.stats.vitality -= player.effects[Object.keys(player.effects)[i]].value;
                    }
                } else if(situation == "before") {
                    if(player.effects[Object.keys(player.effects)[i]].proc.split('-')[1] == 'before') {
                        player.stats.vitality -= player.effects[Object.keys(player.effects)[i]].value;
                    }
                }
            }

            if(player.effects[Object.keys(player.effects)[i]].proc == "buff" || player.effects[Object.keys(player.effects)[i]].duration == 1 || situation == "after") {
                player.stats[player.effects[Object.keys(player.effects)[i]].stat] -= player.effects[Object.keys(player.effects)[i]].value;
            }
                
            if (situation == "after") {
                console.log("Duration: " + player.effects[Object.keys(player.effects)[i]].duration);
                if(player.effects[Object.keys(player.effects)[i]].duration > 1) {
                    player.effects[Object.keys(player.effects)[i]].duration = player.effects[Object.keys(player.effects)[i]].duration - 1;
                } else {
                    delete player.effects[Object.keys(player.effects)[i]];
                }
            }
        }
    }*/
    }

exports.callForVictory = async function(combat, thread, victor) {
    switch(combat.type) {
        case "wild-encounter":
            if(victor == 1) {
                util.updateMainMessage(combat, await thread.fetchStarterMessage(), "victory");
                util.rewardLoot(combat, thread);
            } else {
                util.updateMainMessage(combat, await thread.fetchStarterMessage(), "defeat");
            }

            break;
        case "pvp":
            util.updateMainMessage(combat, await thread.fetchStarterMessage(), "end");
            break;
    }

    for(player of combat.team1.concat(combat.team2)) {
        if(player.type == "human") {
            playerUtils.setState(null, player.id, {name: "idle"});
            const asyncedData = await playerUtils.getData(player.id, "info");
            if(player.health > asyncedData.max_health) {
                playerUtils.health.set(player.id, asyncedData.max_health);
            } else if(player.health < 0) {
                playerUtils.health.set(player.id, 0);
            } else {
                playerUtils.health.set(player.id, player.health);
            }
        }
    }

    const combatCollection = Client.mongoDB.db('combat-data').collection(thread.id);
    combatCollection.drop(function(err, res) {
        if (err) throw err;
        if (res) console.log("[DEBUG] Combat " + thread.id + " deleted.");
    });

    thread.send("Savaş sona erdi !");
    await thread.setLocked(true);
}