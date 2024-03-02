const caracteristics = new Map();
const combatUtils = require('../utils/combatUtils.js');

module.exports = {
  map: caracteristics,
  setupCaracteristics() {
    console.groupCollapsed("-- Karakterler --");
    console.log("Karakterler ayarlanıyor...");
    caracteristics.set("heal", {func: strengh_raw_buff});

    console.log("Karakterler hazır !");
    console.groupEnd();
  },
}

function strengh_raw_buff() {
}
