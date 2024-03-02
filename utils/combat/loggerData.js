

exports.damage = {
    id: "damage",
    get: function (value, player) {
        return  value + " HP kaybetti " + "(" + player.health + "/" + player.max_health + ") "+ "\n";
    }
}

exports.heal = {
    id: "heal",
    get: function (value, player) {
        return "Gained " + value + " (" + player.health + "/" + player.max_health + ") HP\n";
    }
}