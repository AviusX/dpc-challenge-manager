const mongoose = require("mongoose");
const crypto = require("crypto");
const fs = require("fs");
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

const mongoUrl = '';

// =============== Mongoose Setup ===============
mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
// ============================================

// =============== Schema Setup ===============
const challengeSchema = mongoose.Schema({
	challengeName: String,
	flagHash: String
});

const Challenge = mongoose.model("Challenge", challengeSchema);
const flagRegExp = /FRIGIDSEC-DPC\{.+\}/;
// ============================================

// =============== Crypto Setup ===============
const secret = fs.readFileSync(__dirname + '/secret.txt', 'utf8').trim();
const sha256Hasher = crypto.createHmac("sha256", secret);
// ============================================

// =============== Core Logic ===============
console.log("1. Add a new challenge");
console.log("2. View existing challenges");
console.log("3. Delete a challenge");
console.log("4. Search a challenge");
console.log("5. Exit");

readline.question("What do you want to do? (1/2/3/4/5): ", choice => {
	switch (choice) {
		case "1":
			addChallenge();
			break;
		case "2":
			listChallenges();
			break;
		case "3":
			deleteChallenge();
			break;
		case "4":
			searchChallenge();
			break;
		case "5":
			console.log("Exiting...");
			process.exit(0);
		default:
			console.log("Invalid option. Exiting...");
			process.exit(1);
	}
});
// ============================================

// =============== Function Definitions ===============
function addChallenge() {
	readline.question("Enter the challenge name (ex: S0-S1mpl3): ", challengeName => {
		challengeName = challengeName.trim();
		readline.question("Enter the flag (ex: FRIGIDSEC-DPC{s0m3_fl4g}): ", flag => {
			flag = flag.trim();
			if (!flagRegExp.test(flag)) {
				console.log("Error. Flag doesn't match the regex FRIGIDSEC-DPC\\{.+\\}");
				console.log("Exiting...");
				process.exit(1);
			}
			const flagHash = sha256Hasher.update(flag).digest("hex");
			let challenge = new Challenge({
				challengeName: challengeName,
				flagHash: flagHash
			});
			console.log(`\nChallenge Name: ${challengeName}\nFlag: ${flag}\nFlag Hash: ${flagHash}`);

			readline.question("\nAre you sure you want to create this challenge? (y/n): ", confirmation => {
				switch (confirmation.toLowerCase()) {
					case "y":
						Challenge.exists({$or: [{challengeName: challengeName}, {flagHash: flagHash}]}, (err, result) => {
							if (err) {
								console.log("An error occured!");
								console.log(err);
								process.exit(1);
							} else {
								if (result) {
									console.log("\nError. A challenge with this name or flag already exists:");
									Challenge.findOne({$or: [{challengeName: challengeName}, {flagHash: flagHash}]}, (err, duplicateChallenge) => {
										if (err) {
											console.log(err);
										}
										console.log(`Duplicate Challenge Name: ${duplicateChallenge.challengeName}`);
										console.log(`Duplicate Challenge Flag Hash: ${duplicateChallenge.flagHash}`);
										process.exit(1);
									});
								} else {
									challenge.save(() => {
										console.log(`Challenge ${challengeName} successfully added.`);
										process.exit(0);
									});
								}
							}
						});
						break;
					case "n":
						console.log("Okay. Exiting...");
						process.exit(0);
						break;
					default:
						console.log("Invalid answer. Exiting...");
						process.exit(1);
				}
			});
		});
	});
}

function deleteChallenge() {
	readline.question("Enter the name of the challenge you want to delete: ", challengeName => {
		challengeName = challengeName.trim();
		Challenge.exists({challengeName: challengeName}, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				if (result) {
					Challenge.deleteOne({challengeName: challengeName}, (err, deletedChallenge) => {
						if (err) {
							console.log("Error while deleting challenge.");
							console.log(err);
							process.exit(1);
						} else {
							console.log(`Challenge ${challengeName} successfully deleted.`);
							process.exit(0);
						}
					});
				} else {
					console.log(`Error. No challenge named ${challengeName} found.`);
					process.exit(1);
				}
			}
		});
	});
}

function listChallenges() {
	console.log("Here are the existing challenges-");
	Challenge.find({}, (err, challenges) => {
		if (err) {
			console.log("Error while fetching users.");
			console.log(err);
			process.exit(1);
		} else {
			console.log(challenges);
			process.exit(0);
		}
	});
}

function searchChallenge() {
	readline.question("Enter the challenge name you want to search: ", challengeName => {
		challengeName = challengeName.trim();
		Challenge.findOne({challengeName: challengeName}, (err, result) => {
			if (err) {
				console.log("Error while searching for challenge.");
				console.log(err);
				process.exit(1);
			} else {
				console.log(`Challenge Name: ${result.challengeName}`);
				console.log(`Flag Hash: ${result.flagHash}`);
				console.log(`Object ID: ${result._id}`);
				process.exit(0);
			}
		});
	});
}
// ============================================
