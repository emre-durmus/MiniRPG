const { Client, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const rpgInfoUtils = require("./rpgInfoUtils.js");
const classes = require("../data/classes.json");
const abilities = require("../data/abilities.json");
const zones = require("../data/zones.json");
const abilitySetup = require("../setup/abilitySetup.js");

// Player data management

exports.health = {};
exports.energy = {};
exports.exp = {};
exports.class = {};
exports.stats = {};

exports.doesExists = async function (id) {
  const playerDatabase = Client.mongoDB.db("player-data");

  const find = await playerDatabase.listCollections({ name: id }).toArray();

  return find.length > 0;
};

exports.is5Level = async function (id) {
  const info = await exports.getData(id, "info");
  const level = info.level;
  return level >= 5;
};

exports.whichClass = async function (id) {
  const info = await exports.getData(id, "info");
  const whichClass = info.class;
  return whichClass;
};

exports.createskilltype = async function (id, skillType) {
  const { learnAbility } = require("./abilityUtils.js");
  const playerCollection = Client.mongoDB.db("player-data").collection(id);
  await playerCollection.updateOne(
    { name: "info" },
    { $set: { skillType: skillType } },
    { upsert: true }
  );
  const levelRewards = JSON.parse(
    fs.readFileSync("./data/misc/levelRewards.json", "utf8")
  )[skillType];
  if (levelRewards != undefined && levelRewards["5"] != undefined) {
    for (let i = 0; i < levelRewards["5"].length; i++) {
      const ability = levelRewards["5"][i];
      await learnAbility(id, ability.id);
    }
  }
};

exports.ishaveskilltype = async function (id) {
  const info = await exports.getData(id, "info");
  if (typeof info.skillType == "undefined") {
    return false;
  } else return true;
};

exports.create = async function (id, className) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const classData = classes[className];

  const ability = JSON.parse(fs.readFileSync(`./data/misc/levelRewards.json`))[
    className
  ]["0"][0];
  const data = [
    {
      name: "info",
      class: className,
      money: 100,
      level: 1,
      exp: 0,
      state: { name: "idle" },
      health: classData.base_stats.vitality,
      max_health: classData.base_stats.vitality,
      energy: 3,
    },
    {
      name: "stats",
      strength: classData.base_stats.strength,
      vitality: classData.base_stats.vitality,
      resistance: classData.base_stats.resistance,
      spirit: classData.base_stats.spirit,
      agility: classData.base_stats.agility,
      intelligence: classData.base_stats.intelligence,
    },
    {
      name: "inventory",
      items: [],
      equipItems: [],
      abilities: [ability.id],
      activeAbilities: [ability.id],
      equiped: {
        weapon: null,
        helmet: null,
        chestplate: null,
        boots: null,
      },
    },
    {
      name: "misc",
      lastRegen: Date.now(),
      lastEnergy: Date.now(),
      party: { owner: id, members: [] },
    },
    {
      name: "story",
      location: {
        region: "mavibayrak",
        zone: "birincikoy",
        unlocked_regions: ["mavibayrak"],
      },
      quests: [],
    },
  ];

  const options = { ordered: true };

  const result = await playerCollection.insertMany(data, options);
  console.log("[DEBUG] User ID " + id + " created.");
};

exports.remove = async function (id) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  try {
    await playerCollection.drop();
    console.log("[DEBUG] User ID " + id + " removed.");
  } catch (error) {
    console.log(error);
  }
};

exports.getData = async function (id, name) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const query = { name: name };
  const options = {
    projection: { _id: 0 },
  };

  const result = await playerCollection.findOne(query, options);

  return result;
};

exports.getEquiped = async function (id) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);
  const result = await playerCollection.findOne(
    { name: "inventory" },
    {
      projection: {
        _id: 0,
        items: 0,
        equipItems: 0,
        abilities: 0,
        activeAbilities: 0,
      },
    }
  );

  return result.equiped;
};

exports.updateData = async function (id, data, name) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const query = { name: name };
  const update = { $set: data };
  const options = { upsert: true };

  await playerCollection.updateOne(query, update, options);
};

exports.health.set = async function (userID, health) {
  const playerCollection = Client.mongoDB.db("player-data").collection(userID);

  await playerCollection.updateOne(
    { name: "info" },
    { $set: { health: health } },
    { upsert: true }
  );
};

exports.health.add = async function (userID, health) {
  const playerCollection = Client.mongoDB.db("player-data").collection(userID);

  const query = { name: "info" };
  let options = {
    projection: { _id: 0, class: 0, level: 0, exp: 0 },
  };

  const info = await playerCollection.findOne(query, options);
  const newHealth = info.health + health;

  const update = { $set: { health: newHealth } };
  options = { upsert: true };
  await playerCollection.updateOne(query, update, options);
};

exports.energy.set = async function (userID, energy) {
  const playerCollection = Client.mongoDB.db("player-data").collection(userID);

  const update = { $set: { energy: Math.max(3, energy) } };
  await playerCollection.updateOne({ name: "info" }, update, { upsert: true });
};

exports.energy.add = async function (userID, energy) {
  const playerCollection = Client.mongoDB.db("player-data").collection(userID);

  const query = { name: "info" };
  let options = {
    projection: {
      _id: 0,
      class: 0,
      level: 0,
      exp: 0,
      money: 0,
      state: 0,
      health: 0,
      location: 0,
    },
  };

  const info = await playerCollection.findOne(query, options);
  var newEnergy = info.energy + energy;

  if (newEnergy > 3) newEnergy = 3;

  const update = { $set: { energy: newEnergy } };
  await playerCollection.updateOne(query, update, { upsert: true });
};

exports.passiveRegen = async function (userID) {
  const info = await exports.getData(userID, "info");
  const misc = await exports.getData(userID, "misc");

  const lastHealthRegen = misc.lastRegen;
  const lastEnergyRegen = misc.lastEnergy;

  let returnVal = {
    health: info.health,
    energy: info.energy,
    gainedEnergy: 0,
    gainedHealth: 0,
  };

  let infoUpdate = { $set: {} };
  let miscUpdate = { $set: {} };

  const newHealth = info.max_health;
  returnVal.health = newHealth;

  if (newHealth > info.max_health) returnVal.health = info.max_health;

  returnVal.gainedHealth = returnVal.health - info.health;

  infoUpdate.$set.health = returnVal.health;
  miscUpdate.$set.lastRegen = Date.now();

  const gainedEnergy = Math.floor((Date.now() - lastEnergyRegen) / 100);
  const newEnergy = info.energy + gainedEnergy;
  returnVal.energy = newEnergy;

  if (newEnergy > 3) returnVal.energy = 3;

  returnVal.gainedEnergy = returnVal.energy - info.energy;

  infoUpdate.$set.energy = returnVal.energy;
  miscUpdate.$set.lastEnergy = Date.now();

  if (returnVal.health || returnVal.energy) {
    const playerCollection = Client.mongoDB
      .db("player-data")
      .collection(userID);

    playerCollection.updateOne({ name: "info" }, infoUpdate, { upsert: true });
    playerCollection.updateOne({ name: "misc" }, miscUpdate, { upsert: true });
  }

  return returnVal;
};

exports.exp.award = async function (id, exp, channel) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const info = await playerCollection.findOne(
    { name: "info" },
    { projection: { _id: 0 } }
  );

  const newExp = info.exp + exp;
  const newLevel = rpgInfoUtils.calculateNewLevelExp(info.level, newExp);

  console.log(
    `[DEBUG] User ID ${id} gained ${exp} exp and is now level ${newLevel.level} with ${newLevel.exp} exp`
  );

  await playerCollection.updateOne(
    { name: "info" },
    { $set: { exp: newLevel.exp, level: newLevel.level } },
    { upsert: true }
  );

  for (let i = info.level; i < newLevel.level; i++) {
    await exports.exp.getLevelRewards(id, i + 1, channel, info.class);
  }
};

exports.levelUpStats = async function (id, level) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  var info = await exports.getData(id, "info");
  var stats = await exports.getData(id, "stats");
  const userClass = info.class;

  const strength =
    classes[userClass].base_stats.strength * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.strength *
        0.5
    );
  const vitality =
    classes[userClass].base_stats.vitality * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.vitality *
        0.5
    );
  const resistance =
    classes[userClass].base_stats.resistance * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.resistance *
        0.5
    );
  const spirit =
    classes[userClass].base_stats.spirit * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.spirit *
        0.5
    );
  const agility =
    classes[userClass].base_stats.agility * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.agility *
        0.5
    );
  const intelligence =
    classes[userClass].base_stats.intelligence * 1 +
    Math.floor(
      (level * 1 + Math.random() * level * 0.1) *
        classes[userClass].mult_stats.intelligence *
        0.5
    );

  const newMaxHealth = info.max_health - stats.vitality + vitality;
  const newHealth = info.health + (newMaxHealth - info.max_health);
  console.log(
    `[DEBUG] User ID ${id} Old Health: ${
      info.max_health
    } New Health: ${newMaxHealth}, for ${newMaxHealth - info.max_health} gain`
  );

  var query = { name: "stats" };
  var update = {
    $set: {
      strength: strength,
      vitality: vitality,
      resistance: resistance,
      spirit: spirit,
      agility: agility,
      intelligence: intelligence,
    },
  };
  await playerCollection.updateOne(query, update, { upsert: false });

  query = { name: "info" };
  update = { $set: { health: newHealth, max_health: newMaxHealth } };
  await playerCollection.updateOne(query, update, { upsert: false });
};

exports.exp.getLevelRewards = async function (id, level, channel, userClass) {
  if (!channel) return;

  const embed = new EmbedBuilder();
  embed.setColor(0x00ff00);
  embed.setTitle(`Seviye atladın!`);
  embed.setDescription(`<@${id}> ${level} seviyeye ulaştı!`);

  const embed2 = new EmbedBuilder();
  if (level == 5) {
    embed2.setColor(0x00ff00);
    embed2.setTitle(`Eğitim Açıldı!`);
    embed2.setDescription(
      "5.seviyeye ulaştın ve artık yetenek sınıfını seçebilirsin! `megitim` yazarak yetenek sınıfını seç."
    );
  }
  const embed3 = new EmbedBuilder();
  if (level == 5) {
    embed3.setColor(0x00ff00);
    embed3.setTitle(`Yeni Bölgeler açıldı!`);
    embed3.setDescription(
      "5.seviyeye ulaştın ve artık yeni haritalara erişebilirsin! `mtp` yazarak yeni haritalara bir bak."
    );
  }

  var field = "";

  const rewards = JSON.parse(
    fs.readFileSync("./data/misc/levelRewards.json", "utf8")
  )["all"];
  if (rewards != undefined && rewards[level] != undefined) {
    for (const reward of Object.values(rewards[level])) {
      switch (reward.type) {
        case "location":
          field += `Tu as maintenant accès à la zone ${
            zones[reward.id].name
          }.\n`;
          break;
      }
    }
  }

  const levelRewards = JSON.parse(
    fs.readFileSync("./data/misc/levelRewards.json", "utf8")
  )[userClass];
  if (levelRewards != undefined && levelRewards[level] != undefined) {
    for (let i = 0; i < levelRewards[level].length; i++) {
      const reward = levelRewards[level][i];
      switch (reward.type) {
        case "ability":
          const { learnAbility } = require("./abilityUtils.js");
          learnAbility(id, reward.id);
          field += `Ability: ${abilities[reward.id].name}\n`;
          break;
      }
    }
  }

  if (field != "") embed.addFields({ name: "Ödüller", value: field });

  channel.send({ embeds: [embed] });
  if (level == 5) {
    channel.send({ embeds: [embed2] });
  }
  if (level == 5) {
    channel.send({ embeds: [embed3] });
  }

  await exports.levelUpStats(id, level);
};

exports.setClass = async function (id, className) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);
  await playerCollection.updateOne(
    { name: "info" },
    { $set: { class: className } },
    { upsert: true }
  );

  this.updateStats(id, className);

  return true;
};

exports.updateStats = async function (id, className) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  console.log(classes[className]);

  const strength = classes[className].base_stats.strength;
  const vitality = classes[className].base_stats.vitality;
  const resistance = classes[className].base_stats.resistance;
  const spirit = classes[className].base_stats.spirit;
  const agility = classes[className].base_stats.agility;
  const intelligence = classes[className].base_stats.intelligence;

  const query = { name: "stats" };
  const update = {
    $set: {
      strength: strength,
      vitality: vitality,
      resistance: resistance,
      spirit: spirit,
      agility: agility,
      intelligence: intelligence,
    },
  };
  await playerCollection.updateOne(query, update, { upsert: false });

  return true;
};

exports.setLocation = async function (id, zone) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const query = { name: "story" };

  var update = {
    $set: { "location.zone": zone },
  };

  const options = { upsert: true };
  await playerCollection.updateOne(query, update, options);

  return true;
};

exports.setState = async function (playerCollection, id, state) {
  if (playerCollection == null || playerCollection == undefined)
    playerCollection = Client.mongoDB.db("player-data").collection(id);
  const query = { name: "info" };

  if (typeof state == "string") state = { name: state };

  const update = { $set: { state: state } };

  playerCollection.updateOne(query, update, { upsert: true });
};

exports.getState = async function (id) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);

  const query = { name: "info" };
  let options = {
    projection: { _id: 0, class: 0, level: 0, exp: 0 },
  };

  const info = await playerCollection.findOne(query, options);
  return info.state;
};

exports.giveMoney = async function (id, amount) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);
  const info = await this.getData(id, "info");
  const newMoney = info.money + amount;

  const query = { name: "info" };

  const update = { $set: { money: newMoney } };
  const options = { upsert: true };
  const result = await playerCollection.updateOne(query, update, options);

  return true;
};

exports.takeMoney = async function (id, amount, message) {
  const playerCollection = Client.mongoDB.db("player-data").collection(id);
  const info = await this.getData(id, "info");
  const newMoney = info.money - amount;

  if (newMoney < 0) {
    message.channel.send("Bu işlem için yeterli paran yok!");
    return false;
  }

  const query = { name: "info" };
  const update = { $set: { money: newMoney } };
  const options = { upsert: true };
  const result = await playerCollection.updateOne(query, update, options);

  return true;
};
