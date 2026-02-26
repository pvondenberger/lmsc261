const lifeSpan = 1000;

function checkLifeSpan(hoursUsed) {
    let maxLifeSpan = 1000;
    if (hoursUsed < 800) {
        return "Suit is in working condition"
    } else if (hoursUsed >= 800, hoursUsed <= maxLifeSpan){
        return "Suit needs replaced soon"
    } else if (hoursUsed > maxLifeSpan){
        return "Suit needs replaced"
    } else if (hoursUsed != Number){
        return "Please enter valid number"
    }
}

print(checkLifeSpan(prompt("How many hours have you used your suit?")))