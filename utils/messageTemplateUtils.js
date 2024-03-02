const { Client } = require('discord.js');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, MessageActionRow, MessageSelectMenu, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const player = require('../utils/playerUtils.js');
const zonesData = require('../data/zones.json');
const shopsData = require('../data/shops.json');
const classData = require('../data/classes.json');
const combat = require('../manager/combatManager.js')

// Player data management

exports.sendErrorEmbed = async function(message, error) {
	const errorEmbed = new EmbedBuilder()
		.setColor('F08080')
		.setAuthor({name: 'Bir hata meydana geldi'})
		.addFields( { name: 'Komut kullanılırken bir sorun oluştu.', value: error } );
	
	return message.channel.send({embeds: [errorEmbed]});
}

exports.generateSelector = async function(message) {
	list = [];
	for(var i = 0; i < Object.keys(classData).length; i++) {
		list.push({
			label: classData[Object.keys(classData)[i]].name.toString(),
			value: Object.keys(classData)[i].toString(),
		});
	}
	const row = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('classChoice-' + message.author.id)
				.setPlaceholder('Herhangi bir şey seçin')
					.addOptions(
					list
				),
		);
	

	return message.reply({embeds: [embed], components: [row] });
}


exports.sendEncounterMessage = async function(message, type) {
	const mainEmbed = new EmbedBuilder()
		.setTitle('Canavarla karşılaştın')
		.setTimestamp()

	switch(type) {
		case 'wild-encounter':
			mainEmbed.addFields({name: 'Oyuncular', value: 'Oyuncuların katılması bekleniyor...'});
			break;
		default:
			mainEmbed.addFields({name: 'Wrong type', value: 'Something seems to be wrong with our system.', inline: true});
			break;
	}

	/*const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('joinFight-' + message.id + '-1')
				.setLabel('Şimdi Katıl!')
				.setStyle(ButtonStyle.Secondary)
				
		);*/
  
	return message.edit({content:'', embeds: [mainEmbed], components: [] });
}

exports.generateShopSelector = async function(message) {
	list = [];
	const currentLocation = await player.getData(message.author.id, "story");
	for(var i = 0; i < Object.keys(shopsData).length; i++) {

		//zone verification
		var isOkay = false;
		
		for (var j = 0; j < zonesData[currentLocation.location.zone].shops.length; j++) {
			if (zonesData[currentLocation.location.zone].shops[j] == Object.keys(shopsData)[i]) {
				isOkay = true;
			}
		}

		if (!isOkay) {
			continue;
		}
			
		console.log('ok');

		list.push({
			label: shopsData[Object.keys(shopsData)[i]].name.toString(),
			value: Object.keys(shopsData)[i].toString(),
		});
	}

	var row = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('shopChoice-' + message.author.id)
				.setPlaceholder('Herhangi bir şey seçin')
					.addOptions(
					list
				),
		);

	console.log(list.length);

	if(list.length == 0) {
		var row = new EmbedBuilder() 
			.setColor(0x1be118)
			.setTitle('Bu bölgede satıcı yok')	
			.setDescription('Bulunduğun haritada satış yapan bir tüccar yok.');

		return message.reply({content: 'Kullanmak istediğin satıcıyı seç !', embeds: [row] });
	}
				

	return message.reply({content: 'Kullanmak istediğin satıcıyı seç !', components: [row] });
}

exports.generateShopItemsSelector = async function(message, shop, item, quantity) {
	list = [];
	for(var i = 0; i < Object.keys(shopsData[shop].items).length; i++) {
		list.push({
			label: shopsData[shop].items[Object.keys(shopsData[shop].items)[i]].name.toString() + ' - ' + shopsData[shop].items[Object.keys(shopsData[shop].items)[i]].cost.toString() + ' yang',
			value: shopsData[shop].items[Object.keys(shopsData[shop].items)[i]].id.toString(),
		});
	}

	var ShopEmbed = new EmbedBuilder()
                .setColor(0x1be118)
                .setTitle(shopsData[shop].name)
				.setThumbnail(shopsData[shop].picture)

	if(item != "0") {
		var currentItem = shopsData[shop].items[item].name;
		var currentPicture = shopsData[shop].items[item].picture;
		var ShopEmbed = new EmbedBuilder()
				.setColor(0x1be118)
				.setTitle(shopsData[shop].name)
				.setThumbnail(currentPicture)
				.setDescription( currentItem + ' seçtin !');
	}


	if(quantity != "0") {
		var currentQuantity = quantity;

		var ShopEmbed = new EmbedBuilder()
				.setColor(0x1be118)
				.setTitle(shopsData[shop].name)
				.setDescription(currentQuantity + ' tane almayı seçtin !');
	}

	if(shopsData[shop].buy_only_one == 1){
		quantity = 1;
	}

	if(item != "0" && quantity != "0") {
		var currentItem = shopsData[shop].items[item].name;
		var currentPicture = shopsData[shop].items[item].picture;
		var currentQuantity = quantity;
		var ShopEmbed = new EmbedBuilder()
				.setColor(0x1be118)
				.setTitle(shopsData[shop].name)
				.setThumbnail(currentPicture)
				.setDescription(currentQuantity + ' adet ' + currentItem + ' seçtin !');
	}
	
	const row = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('shopItemChoice-' + message.user.id)
				.setPlaceholder('Eşya seç')
					.addOptions(
					list
				),
		);

	const row2 = new ActionRowBuilder()
		.addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('shopAmountChoice-' + message.user.id)
				.setPlaceholder('Adet seç')
					.addOptions(
					[
						{
							label: '1',
							value: '1',
						},
						{
							label: '2',
							value: '2',
						},
						{
							label: '3',
							value: '3',
						},
						{
							label: '4',
							value: '4',
						},
						{
							label: '5',
							value: '5',
						},
						{
							label: '6',
							value: '6',
						},
						{
							label: '7',
							value: '7',
						},
						{
							label: '8',
							value: '8',
						},
						{
							label: '9',
							value: '9',
						},
						{
							label: '10',
							value: '10',
						},
					]
				),
		);
		const button = new ButtonBuilder()
		.setCustomId('buyItem-' + message.user.id + '-' + shop + '-' + item + '-' + quantity)
		.setLabel('Satın Al')
		.setStyle(ButtonStyle.Success);

		const buyButton = new ActionRowBuilder()
		.addComponents(
			button
		);

	if(item == "0" && quantity == "0" && shopsData[shop].buy_only_one == 1) {
	message.reply({content: 'Almak istediğin nesneyi seç !', embeds:[ShopEmbed], components: [row, buyButton] });
	}else if(item == "0" && quantity == "0") {
	message.reply({content: 'Almak istediğin nesneyi seç !', embeds:[ShopEmbed], components: [row, row2, buyButton] });
	}  else if(item != "0" && quantity == "0" && shopsData[shop].buy_only_one == 0) {
	message.reply({content: 'Kaç adet almak istersin ? !', embeds:[ShopEmbed], components: [row2, buyButton] });
	} else if(item == "0" && quantity != "0") {
	message.reply({content: 'Almak istediğin nesneyi seç !', embeds:[ShopEmbed], components: [row, buyButton] });
	} else if(item != "0" && quantity != "0") {
	message.reply({content: 'Satın almak istediğine emin misin ?', embeds:[ShopEmbed], components: [buyButton] });
	}
	return; 
}