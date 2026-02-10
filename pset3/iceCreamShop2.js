const conesSoldPerHour = 12;

let hour = 1;

let inventory = 60;

for(hour; hour <= 12; hour++){
print(conesSoldPerHour * hour + " sold at hour " + hour)
inventory = inventory - 3;
print(inventory + " left");
}