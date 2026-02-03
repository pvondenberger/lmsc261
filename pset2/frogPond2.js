const activities = ["babysit tadpoles", "flies for lunch", "tongue stretch", "swimming lesson"];

let input = prompt("What activity?");
let selection = activities[input % 4];

print(selection);