const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const classData = require('../../data/classes.json');
const player = require('../../utils/playerUtils.js');
const fs = require('fs');

module.exports = {
    name: "welcome",
    interact: async function(interaction, args) 
    {
        if(args[1] != interaction.user.id) 
        {
            interaction.deferUpdate();
            return;
        }
        const author = interaction.user;
        const embed = new EmbedBuilder();
        const button = new ActionRowBuilder();

        switch(args[0]) 
        {
            case "0":
                embed
                    .setTitle(":crossed_swords: MiniMt2 Dünyası :crossed_swords:")
                    .addFields({name: "Nasıl öğrenebilirim ?", value: "myardım veya mh yazarak komutları öğrenebilirsin."},
                               {name: "Bu dünyadaki amacımız ne?", value: "Sonu olan bir maceraya değer vermiyoruz, çünkü en iyi macera asla bitmemeli, değil mi? Keşfedebildiğin kadar çok şey keşfet, bu evrenin her parçasını keşfet, her zaman keşfedilecek başka bir şey olacak!"},
                               {name: ":crossed_swords: Hadi Maceracı! :crossed_swords:", value:"Uzun bir süredir Ejderha Tanrısının nefesi Jinno , Chunjo ve Shinsoo krallıklarını korudu. Ancak bu büyüleyici sihir dünyası korkunç bir tehditle karşı karşıyadır: Phebia Taşı'nın etkisi yalnızca tüm kıtayı yaralamakla kalmadı, aynı zamanda tüm ülkede ve sakinlerinde kaosa ve yıkıma neden oldu. Krallıklar arasında savaş çıktı, vahşi hayvanlar öfkeli canavarlara dönüştü ve ölüler kana susamış yaratıklar olarak hayata döndü. Ejderha Tanrısı'nın müttefiklerinden biri olarak Phebia Taşı'nın karanlık etkisiyle savaşın. Korku, acı ve yıkım dolu bir gelecekten krallığınızı kurtarmak için tüm gücünüzü toplayın ve silahlarınızı ele geçirin!"})
                    .setColor(0xFF7F50)

                
                    button.addComponents(
                        new ButtonBuilder()
                            .setCustomId("welcome-1-" + interaction.user.id)
                            .setLabel("Devam Et")
                            .setStyle(ButtonStyle.Secondary)
                    )
                interaction.update({embeds: [embed], components: [button]});
                break;
            case "1":
                embed
                    .setTitle(":crossed_swords: Discord Kanalımız")
                    .setDescription("Oyunumuz henüz geliştirme aşamasında olduğu için Discord kanalımıza gelerek oyunumuzun gelişmesine ve bize katkı sağlayabilirsin.")
                    .setColor(0xFF7F50)
                    .addFields(
                        {name: "Hala anlamadığım şeyler var diyorsan", value: "Discord sunucumuzdaki yardım kanalını kullanarak bize ulaşabilirsin! [DISCORD SUNUCUMUZ](https://discord.gg/nej83eKhbM)."},
                        {name: "Öğretici var mı?", value: "Henüz bir öğreticimiz yok, ancak daha iyi anlamak için Discord sunucumuzun [Yolculuğunuza Başlarken] sayfasına göz atabilirsiniz."}
                    )

                    button.addComponents(
                        new ButtonBuilder()
                            .setCustomId("welcome-2-" + interaction.user.id)
                            .setLabel("Devam Et")
                            .setStyle(ButtonStyle.Secondary)
                    )

                interaction.update({embeds: [embed], components: [button]});
                break;
            case "2":
                embed
                    .setTitle(":crossed_swords: Son Adım!")
                    .setDescription("Neredeyse hazırız! Macerana başlamadan önce aşağıdaki seçim menüsünü kullanarak bir sınıf seçmelisin!")
                    .setColor(0xFF7F50)
                    list = [];

                    for(const [className, classInfo] of Object.entries(classData)) {
                        list.push({
                            label: classInfo.name,
                            value: className,
                            description: classInfo.description
                        });
                    }
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('classChoice-' + author.id)
                                .setPlaceholder('Herhangi bir sınıf seç')
                                    .addOptions(
                                    list
                                ),
                        );
                    interaction.update({embeds: [embed], components: [row]});
            break;
          case "3":
             embed
                    .setTitle(":crossed_swords: Beceri Sınıfı! :crossed_swords:")
                    .setDescription("Biraz tecrübe edindin ve artık yetenek sınıfını seçmeye hazırsın! Sana uygun olanı seç ve maceranda yeni kapıları aç!")
                    .setColor(0xFF7F50)
                    const whichClass = await player.whichClass(author.id);
                    list2 = [];

            const skillTypes = JSON.parse(fs.readFileSync("./data/skillTypes.json", "utf8"))[whichClass];
                    for(const [skillTypeName, skillTypeInfo] of Object.entries(skillTypes)) {
                          list2.push({
                            label: skillTypeInfo.name,
                            value: skillTypeName,
                            description: skillTypeInfo.description
                          });
                        }            
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('skillTypeChoice-' + author.id)
                                .setPlaceholder('Herhangi bir yetenek sınıfı seç')
                                    .addOptions(
                                    list2
                                ),
                        );
    interaction.update({embeds: [embed], components: [row2]});
        }
    }
}