const { prefix,prefix2 } = require('../config.json');
const { EmbedBuilder } = require('discord.js');
const player = require('../utils/playerUtils.js');
const template = require('../utils/messageTemplateUtils.js');
const permsUtils = require('../utils/permsUtils.js');

module.exports = {
    name: 'messageCreate',
    async trigger(message, client) {
        if (message.author.bot) return;
        if (!message.content.toLowerCase().startsWith(prefix)){
            return;
        }else {
            var type = message.content.charAt(0);
        }

        // args is an array that contains all the words after the command
        const args = message.content.slice(type.length).split(/ +/);
        // command is now the first argument (the command, yea)
        const command = args.shift().toLowerCase();

        if(!command) return;

        // If the command is not in the collection, return
        /*if (!client.commands.has(command) || message.author.bot) {

            const unknownEmbed = new EmbedBuilder()
            .setColor('F08080')
            .setAuthor({name: 'Bu komut mevcut değil !'})
            .addFields( { name: 'Komutu yanlış yazmış olabilir veya henüz aktif olmayan bir komutu denemiş olabilirsin..', value: 'Eğer emin değilsen, `mh` komutuyla yardım menüsüne ulaşabilirsin.' } );
            
            //message.channel.send({embeds: [unknownEmbed]});
            return;
        };*/

        const executeCmd = client.commands.get(command);
        
        // Check if the command requires a character to exist in the database
        if(executeCmd.requireCharacter && !(await player.doesExists(message.author.id))) {
            // If it doesn't exist, send a message to the user
            const noCharacterEmbed = new EmbedBuilder()
                .setColor('F08080')
                .setAuthor({name: 'Karakter bulunamadı!'})
                .addFields({ name: 'Bu komutu kullanabilmek için bir karakter oluşturmalısın.', value: '`mb` komutunu kullanarak karakterini oluşturabilirsin.' })
            
            message.channel.send({embeds: [noCharacterEmbed]});
            return;
        }

        if(executeCmd.requireState != null && !executeCmd.requireState.contains(player.getState(message.author.id))) {
            template.sendErrorEmbed(message, 'Şuanki durumunda bu komutu kullanamazsın.');
            return;
        }

        // Check if the command requires a permission to be executed
        if(client.commands.get(command).requirePerm && await permsUtils.checkPerms(command, message.author.id) == false) {
            const noPermEmbed = new EmbedBuilder()
                .setColor('F08080')
                .setAuthor({name: 'You do not have the permissions to use this command'})
                .addFields( { name: 'Ask an admin !', value: 'They need to use the permadd command to give you the permissions' })
                        
            message.channel.send({embeds: [noPermEmbed]});
            return;
        }
        

        try {
            await client.commands.get(command).execute(message, args);
        } catch(error) {
            // Catch the error if there's a dev issue
            console.error(error);
            const errorEmbed = new EmbedBuilder()
            .setColor('FF0000')
            .setAuthor({name: 'Hata!'})
            .addFields( { name: 'Hatalı komut', value: 'Kullanmak istediğiniz komut hatalı' });
            
            message.channel.send({embeds: [errorEmbed]});
        }
    }
}