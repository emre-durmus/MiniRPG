const fs = require("fs");

module.exports = {
    setupEvents(client) {
      console.groupCollapsed("-- Olaylar --");
        const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(`./../events/${file}`);
            console.log("Olay yükleniyor: " + event.name);
            if (event.once) {
                client.once(event.name, (...args) => event.trigger(...args, client));
            } else {
                client.on(event.name, (...args) => event.trigger(...args, client));
            }
        }
        console.groupEnd();
    }
}