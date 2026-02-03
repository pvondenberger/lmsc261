let numFrogs = prompt("How many frogs are about to jump in?");

const maxFrogs = 15;

let enter = numFrogs <= maxFrogs;

let messageToPrint = enter ? "Come on in!" : "It's too crowded!";

print(messageToPrint);