const dailyActivities = [
	"Clean Solar Panel",
	"Video Chat with Houston",
	"Hydrate Space Food",
	"Take Earth Picture",
	"Learn Russian"
]

function pickRandomActivity(activity) {
return dailyActivities[activity]
}

let randomIndex = Math.random() * dailyActivities.length;
let randomActivity = Math.floor(randomIndex);

print("Your daily activity is " + pickRandomActivity(randomActivity))