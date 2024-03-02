const player = require('../utils/playerUtils.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "help",
    aliases: ["h", "yardım", "help"],
    description: "",
    requireCharacter: false,
    async execute(message, args) {
        const author = message.author;

        if(await player.doesExists(author.id)) {
            const embed = new EmbedBuilder()
                .setTitle("Yardım")
                .setThumbnail("https://i.hizliresim.com/qqe1uos.png")
                .setColor(0xADD8E6)
                .addFields(
                    { name: "Hızlı Başlangıç", value: "Oyuna hızlıca atılmak istiyorsan öncelikle `mtp` ile ışınlanabilir ve ardından `ms` komutunu yazarak canavarlarla savaşabilirsin."},
                  { name: "Eğitim", value: "`megitim` ile karakterin 5.seviyeye ulaştıktan sonra sınıf seçimi yapabilirsin."},
                  { name: "Birşeyler Satın Almak", value: "`msatici` ile mevcut bölgendeki mağazaları görüntüleyebilir ve alışveriş yapabilirsin. Unutma! Satıcılar bulunduğun haritaya göre değişiklik gösterir."},
                  { name: "Sık Kullanılan Komutlar", value: "`mc` komutu ile karakter sayfasına ulaşabilirsin. \n canını yenilemek için `mtp` ile Birinci Köy'e geri dönebilirsin. "},
                    { name: "Discord Sunucumuz", value: "Daha detaylı komutlar ve herhangi bir yardım için --> Discord sunucumuza katılabilirsin. [DISCORD SUNUCUMUZ](https://discord.gg/nej83eKhbM)."},
                    { name: "Herhangi bir hata,bug veya eksik bilgi mi mevcut?", value: "Bunları Discord üzerindeki Hata-Bildirim sayfamizdan ulaştırırsan seve seve yardımcı olmak isteriz!"},
                    { name: "Botu davet etmek istiyorum", value: "Oldukça basit, `mdavet` komutunu kullanarak botu başka bir sunucuya ekleyebilirsin.!"}
                )

            message.channel.send({embeds: [embed]});
        } else {
            const newEmbed = new EmbedBuilder()
                .setTitle("Yardım")
                .setThumbnail("https://i.hizliresim.com/qqe1uos.png")
                .setColor(0x1be118)
                .setDescription("Aha.. Yeni bir maceracı mısın? Tanıştığıma sevindim! Eğer macerana şimdi başlamak istersen, `mbasla` yazarak macerana başlayabilirsin!")
                .addFields(
                    { name: "Hızlı Başlangıç", value: "Karakterini oluşturduktan sonra oyuna hızlıca atılmak istiyorsan öncelikle `mtp` ile ışınlanabilir ve ardından `ms` komutunu yazarak canavarlarla savaşabilirsin."},
                  { name: "Eğitim", value: "`megitim` ile karakterin 5.seviyeye ulaştıktan sonra sınıf seçimi yapabilirsin."},
                  { name: "Birşeyler Satın Almak", value: "`msatici` ile mevcut bölgendeki mağazaları görüntüleyebilir ve alışveriş yapabilirsin. Unutma! Satıcılar bulunduğun haritaya göre değişiklik gösterir."},
                  { name: "Sık Kullanılan Komutlar", value: "`mc` komutu ile karakter sayfasına ulaşabilirsin. \n canını yenilemek için `mtp` ile Birinci Köy'e geri dönebilirsin. "},
                    { name: "Discord sunucumuz", value: "Daha detaylı komutlar ve herhangi bir yardım için --> Discord sunucumuza katılabilirsin. [DISCORD SUNUCUMUZ](https://discord.gg/nej83eKhbM)."},
                    { name: "Herhangi bir hata,bug veya eksik bilgi mi mevcut?", value: "Bunları Discord üzerindeki Hata-Bildirim sayfamizdan ulaştırırsan seve seve yardımcı olmak isteriz!"},
                    { name: "Botu davet etmek istiyorum", value: "Oldukça basit, `mdavet` komutunu kullanarak botu başka bir sunucuya ekleyebilirsin.!"}
                )

            message.channel.send({embeds: [newEmbed]});
        }
    }
}