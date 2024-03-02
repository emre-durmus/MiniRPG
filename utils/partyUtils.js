const { EmbedBuilder } = require("@discordjs/builders")
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const player = require("../utils/playerUtils.js")

/**
 * Basic error message for the party command
 * @param {*} message message to respond to
 */
exports.sendError = function(message, reason) {
    const embed = new EmbedBuilder()
        .setTitle("Hata !")
        .setDescription("Sebep: " + reason)
        .setFooter({text: "Daha fazla bilgi için, `mgrup yardim` yazabilirsin."})
        .setColor(0xb22222)

    message.channel.send({ embeds: [embed] });
}

/**
 * send general help for the party command
 * @param {*} message message to respond to 
 */
exports.sendHelp = function(message) {

    const embed = new EmbedBuilder()
        .setTitle("Grup Sistemi Yardım")
        .setDescription("Arkadaşlarınla grup kur ve savaşlara birlikte katılın!")
        .addFields(
            { name: "Bulunduğun grubu göster", value: "`mgrup`" },
            { name: "Başkasının grubunu göster", value: "`mgrup göster <@kullanıcı>`\n" },
            { name: "Birilerini grubuna davet et", value: "`mgrup ekle <@kullanıcı>`" },
            { name: "Gruptan ayrıl", value: "`mgrup ayrıl`" },
            { name: "Grubundan birini at", value: "`mgrup at <@kullanici>`" },
            { name: "Grubu dağıt", value: "`mgrup dağıt`" },
        )
        .setColor(0xff8c00)

    message.channel.send({ embeds: [embed] });
}

/**
 * Displays the party of the player sent in parameter
 * @param {*} message message sent by the sender
 * @param {*} id player id
 * @returns 
 */
exports.displayParty = async function(message, id) {
    const playerData = await player.getData(id, "misc");

    if(!playerData) {
        this.sendError(message, "Kullanıcı mevcut değil !");
        return;
    }

    if(playerData.party.members.length == 0) {
        this.sendError(message, "Karakter grupta değil!");
        return;
    }

    const partyOwnerData = await player.getData(playerData.party.owner, "misc");

    const embed = new EmbedBuilder()
        .setTitle(message.author.username + " Grubu")
        .setDescription("Lider: <@" + partyOwnerData.party.owner + ">")
        .setColor(0x00bfff)
        .addFields(
            { name: "Üyeler", value: partyOwnerData.party.members.map(member => "<@" + member + ">").join("\n") }
        )

    message.channel.send({ embeds: [embed] });
}

exports.invite = async function(message, id) {
    const author = message.author;

    if(id == author.id) {
        this.sendError(message, "Kendini davet edemezsin !");
        return;
    }

    const authorData = await player.getData(author.id, "misc");
    const targetData = await player.getData(id, "misc");

    if(!authorData || !targetData) {
        this.sendError(message, "Hedef kullanıcı mevcut değil!");
        return;
    }

    if(authorData.party.owner != author.id && authorData.party.owner != null) {
        this.sendError(message, "Grup lideri sen değilsin!");
        return;
    }

    if(targetData.party.members.length != 0) {
        this.sendError(message, "Kullanıcı zaten grupta !");
        return;
    }

    if(authorData.party.members.length >= 4) {
        this.sendError(message, "Grubun dolu !");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("Grup Daveti")
        .setDescription(author.username + " kullanıcısının grubuna davet edildin !")
        .setColor(0x00bfff)

    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel("Gruba Katıl !") 
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("party_accept-" + author.id + "-" + id)
        );

    message.guild.members.cache.get(id).send({ embeds: [embed], components: [button] }).catch(error => {this.sendError(message, "Davet etmek istediğiniz kişi sunucudan gelen direkt mesajlara izin vermiyor. Lütfen etkinleştirmesini hatırlatınız ٩(＾◡＾)۶")})
}

exports.acceptInvitation = async function(accepteeId, senderId, interaction) {
    const accepteeData = await player.getData(accepteeId, "misc");
    const senderData = await player.getData(senderId, "misc");

    if(!accepteeData || !senderData) {
        interaction.reply("Oyuncu bulunamadı !");
        return;
    }

    //console.log(accepteeData.party.owner);
    //console.log(accepteeId);
    if(senderData.party.members.length >= 4) {
        interaction.reply("Grup dolu!");
        return;
    }
    if(accepteeData.party.members.length != 0) {
        interaction.reply("Zaten bir gruptasın!");
        return;
    }
    if(accepteeData.party.owner == senderId) {
        interaction.reply("Zaten bu gruptasın !");
        return;
    }
    if(accepteeData.party.owner != accepteeId && accepteeData.party.owner != null) {
        interaction.reply("Zaten bir grubun var !");
        return;
    }

    senderData.party.members.push(accepteeId);
    accepteeData.party.members.push(accepteeId);
    accepteeData.party.members.push(senderData.party.members);
    accepteeData.party.owner = senderId;

    await player.updateData(accepteeId, accepteeData, "misc");
    await player.updateData(senderId, senderData, "misc");

    const embed = new EmbedBuilder()
        .setTitle("Grup daveti kabul edildi")
        .setDescription("<@" + senderId + ">' grubuna katıldın !")
        .setColor(0x00bfff)

    interaction.reply({ embeds: [embed] });
}

exports.kick = async function(message, targetId) {
    const author = message.author;

    if(targetId == author.id) {
        this.sendError(message, "Kendini atamazsın !");
        return;
    }

    const authorData = await player.getData(author.id, "misc");
    const targetData = await player.getData(targetId, "misc");

    if(!authorData || !targetData) {
        this.sendError(message, "Böyle bir kullanıcı yok!");
        return;
    }

    if(authorData.party.owner != author.id && authorData.party.owner != null) {
        this.sendError(message, "Grubun lideri değilsin !");
        return;
    }

    if(targetData.party.owner != author.id) {
        this.sendError(message, "Kullanıcı senin grubunda değil !");
        return;
    }

    authorData.party.members = authorData.party.members.filter(member => member != targetId);
    targetData.party.owner = targetId;
    targetData.party.members = [];

    await player.updateData(targetId, targetData, "misc");
    await player.updateData(author.id, authorData, "misc");
    const embed = new EmbedBuilder()
        .setTitle("Gruptan atıldı")
        .setDescription("<@" + author.id + "> grubundan <@" + targetId + "> kicklendi !")
        .setColor(0x00bfff)

    message.reply({ embeds: [embed] });
}

exports.disband = async function(message) {
    const author = message.author;

    const authorData = await player.getData(author.id, "misc");

    if(!authorData) {
        this.sendError(message, "Karakterin mevcut değil!");
        return;
    }

    if(authorData.party.owner != author.id) {
        this.sendError(message, "Grubunun lideri değilsin !");
        return;
    }

    if(authorData.party.members.length == 0) {
        this.sendError(message, "Bir grupta değilsin !");
        return;
    }

    const members = authorData.party.members;

    for(let i = 0; i < members.length; i++) {
        const memberData = await player.getData(members[i], "misc");

        memberData.party.owner = members[i];
        memberData.party.members = [];

        await player.updateData(members[i], memberData, "misc");
    }

    authorData.party.owner = null;
    authorData.party.members = [];

    await player.updateData(author.id, authorData, "misc");

    const embed = new EmbedBuilder()
        .setTitle("Grup dağıldı")
        .setDescription("Grubunuz dağıldı !")
        .setColor(0x00bfff)

    message.reply({ embeds: [embed] });
}

exports.quit = async function(message) {
    const author = message.author;

    const authorData = await player.getData(author.id, "misc");

    if(!authorData) {
        this.sendError(message, "Karakterin mevcut değil!");
        return;
    }

    if(authorData.party.owner == null || authorData.party.members.length == 0) {
        this.sendError(message, "Bir grupta değilsin !");
        return;
    }

    if(authorData.party.owner == author.id) {
        this.sendError(message, "Grup liderisiniz, `mgrup dağıt` kullanmalısınız !");
        return;
    }

    const ownerData = await player.getData(authorData.party.owner, "misc");

    ownerData.party.members = ownerData.party.members.filter(id => id != author.id);
    authorData.party.owner = author.id;
    authorData.party.members = authorData.party.members.filter(id => id != author.id);

    await player.updateData(author.id, authorData, "misc");

    const embed = new EmbedBuilder()
        .setTitle("Grup")
        .setDescription("Gruptan ayrıldın !")
        .setColor(0x00bfff)

    message.channel.send({ embeds: [embed] });
}

exports.disband = async function(message) { 
    const author = message.author;

    const authorData = await player.getData(author.id, "misc");

    if(!authorData) {
        this.sendError(message, "Karakterin mevcut değil!");
        return;
    }

    if(authorData.party.owner == null || authorData.party.members.length == 0) {
        this.sendError(message, "Bir grupta değilsin !");
        return;
    }

    if(authorData.party.owner != author.id) {
        this.sendError(message, "Grup lideri değilsin!");
        return;
    }

    authorData.party.owner = author.id;
    authorData.party.members = [];

    for(const member of authorData.party.members) {
        const memberData = await player.getData(member, "misc");

        memberData.party.owner = member;
        memberData.party.members = [];

        await player.updateData(member, memberData, "misc");
    }

    await player.updateData(author.id, authorData, "misc");

    const embed = new EmbedBuilder()
        .setTitle("Grup")
        .setDescription("Grubu dağıttınız")
        .setColor(0x00bfff)

    message.channel.send({ embeds: [embed] });
}