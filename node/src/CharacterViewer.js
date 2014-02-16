var fs = require('fs');
var FilePosition = require('./FilePosition');
var Character = require('./Character');
var D2DataView = require('./D2DataView');

var _debug, _zeroPadBinary, debugUtils;

if (process.env.NODE_ENV === 'development') {
	process.env.NODE_DEBUG = true;

	debugUtils = require('./DebugUtils');

	_debug = debugUtils.debug;
	_zeroPadBinary = debugUtils.zeroPadBinary;
}
else {
	_debug = _zeroPadBinary = function() { return '' };
}

var ATTRIBUTE_TABLE = {
	0: {
		name: 'Strength',
		bitWidth: 10
	},
	1: {
		name: 'Energy',
		bitWidth: 10
	},
	2: {
		name: 'Dexterity',
		bitWidth: 10
	},
	3: {
		name: 'Vitality',
		bitWidth: 10
	},
	4: {
		name: 'Unallocated Stat Points',
		bitWidth: 10
	},
	5: {
		name: 'Unallocated Skill Points',
		bitWidth: 8
	},
	6: {
		name: 'Current Hitpoints',
		bitWidth: 21
	},
	7: {
		name: 'Max Hitpoints',
		bitWidth: 21
	},
	8: {
		name: 'Current Mana',
		bitWidth: 21
	},
	9: {
		name: 'Max Mana',
		bitWidth: 21
	}
};

var CHARACTER_CLASSES = ['Amazon', 'Sorceress', 'Necromancer', 'Paladin', 'Barbarian', 'Druid', 'Assassin'];

var ID_VALUES = {
	fileId: 0xAA55AA55,
	questsHeaderId: "Woo!",
	waypointSectionId: "WS"
};

var WAYPOINT_NAMES = [
	[
		'Rogue Encampment',
		'Cold Plains',
		'Stony Field',
		'Dark Wood',
		'Black Marsh',
		'Outer Cloister',
		'Jail, Level 1',
		'Inner Cloister',
		'Catacombs, Level 2'
	],
	[
		'Lut Gholein',
		'Sewers, level 2',
		'Dry Hills',
		'Halls of the Dead, level 2',
		'Far Oasis',
		'Lost City',
		'Palace Cellar, level 1',
		'Arcane Sanctuary',
		'Canyon of the Magi'
	],
	[
		'Kurast Docks',
		'Spider Forest',
		'Great Marsh',
		'Flayer Jungle',
		'Lower Kurast',
		'Kurast Bazaar',
		'Upper Kurast',
		'Travincal',
		'Durance of Hate, Level 2'
	],
	[
		'Pandemonium Fortress',
		'City of the Damned',
		'River of Flames'
	],
	[
		"Harrogath",
		"Frigid Highlands",
		"Arreat Plateau",
		"Crystalline Passage",
		"Halls of Pain",
		"Glacial Trail",
		"Frozen Tundra",
		"The Ancients' Way",
		"Worldstone Keep, Level 2"
	]
];

var CharacterViewer = function(filename) {
	var characterViewer = this;

	fs.readFile(filename, function(err, data) {
		if (err) {
			console.error(err);
			return;
		}

		var ab = new ArrayBuffer(data.length);
		var view = new D2DataView(ab);
		for (var i = 0; i < data.length; ++i) {
			ab[i] = data[i];
		}

		characterViewer.parseFileData(view);
	});
};

CharacterViewer.prototype.parseFileData = function(view) {
	var characterViewer = this;

	var position = new FilePosition();

	var characterData = {};

	function parseAttribute(filePosition) {
		var attributeId = view.getBits(filePosition.bytes, filePosition.bits, 9);

		if (!(attributeId in CharacterViewer.attributeTable)) {
			throw new Error('Unknown attribute ID: ' + attributeId);
		}

		var attributeInfo = CharacterViewer.attributeTable[attributeId];

		var value = view.getBits(filePosition.bytes, filePosition.bits, attributeInfo.bitWidth);

		return {
			name: attributeInfo.name,
			value: value
		};
	}

	function isBitNSet(data, index) {
		return ((data & (1 << index)) >> index) === 1;
	}

	function gotQuestFromNPC(data) {
		return isBitNSet(data, 2);
	}

	function questCompleted(questData) {
		return isBitNSet(questData, 0);
	}

	function questAcknowledged(questData) {
		return isBitNSet(questData, 12);
	}

	function getCommonQuestData(questData) {
		return {
			gotFromNPC: gotQuestFromNPC(questData),
			completed: questCompleted(questData)
		}
	}


	function questsActI(filePosition) {
		var quests = {
			"Den of Evil": {},
			"Sister's Burial Grounds": {},
			"Tools of the Trade": {},
			"The Search for Cain": {},
			"The Forgotten Tower": {},
			"Sisters to the Slaughter": {},
			"Cow Level": {}
		};

		var introducedToWarriv = view.getUint16(filePosition);

		_debug('Has been introduced:', introducedToWarriv);

		var denOfEvil = view.getUint16(filePosition);

		_debug('Den of Evil completion:', _zeroPadBinary(denOfEvil, 16));

		quests['Den of Evil'] = getCommonQuestData(denOfEvil);

		quests['Den of Evil'].enteredDen = isBitNSet(denOfEvil, 4);

		var burialGrounds = view.getUint16(filePosition);

		_debug('Burial Grounds completion:', _zeroPadBinary(burialGrounds, 16));

		quests["Sister's Burial Grounds"] = getCommonQuestData(denOfEvil);

		quests["Sister's Burial Grounds"].enteredBurialGrounds = isBitNSet(denOfEvil, 4);

		var toolsOfTheTrade = view.getUint16(filePosition);

		_debug('Tools of the Trade completion:', _zeroPadBinary(toolsOfTheTrade, 16));

		quests["Tools of the Trade"] = getCommonQuestData(denOfEvil);

		quests["Tools of the Trade"].gotHoradricMalus = isBitNSet(denOfEvil, 6);

		quests["Tools of the Trade"].CharsiWaiting = isBitNSet(toolsOfTheTrade, 1);

		var theSearchForCain = view.getUint16(filePosition);

		_debug('The Search for Cain completion:', _zeroPadBinary(theSearchForCain, 16));

		quests["The Search for Cain"] = getCommonQuestData(theSearchForCain);

		quests["The Search for Cain"].enteredTristram = isBitNSet(theSearchForCain, 4);

		quests["The Search for Cain"].failedToRescueCain = isBitNSet(theSearchForCain, 14);

		quests["Cow Level"].completed = isBitNSet(theSearchForCain, 10);

		var theForgottenTower = view.getUint16(filePosition);

		_debug('The Forgotten Tower completion:', _zeroPadBinary(theForgottenTower, 16));

		quests["The Forgotten Tower"] = getCommonQuestData(theForgottenTower);

		delete quests["The Forgotten Tower"].gotFromNPC;

		quests["The Forgotten Tower"].readMoldyTome = isBitNSet(theForgottenTower, 2);

		var sistersToTheSlaughter = view.getUint16(filePosition);

		_debug('Sisters to the Slaughter completion:', _zeroPadBinary(sistersToTheSlaughter, 16));

		quests["Sisters to the Slaughter"].completed = questCompleted(sistersToTheSlaughter);

		return quests;
	}

	function questsActII(filePosition) {
		var quests = {
			"Radament's Lair": {},
			"The Horadric Staff": {},
			"Tainted Sun": {},
			"Arcane Sanctuary": {},
			"The Summoner": {},
			"The Seven Tombs": {}
		};

		var hasTraveledToAct2 = view.getUint16(filePosition) > 0;

		_debug('has traveled to act 2?', hasTraveledToAct2);

		var introducedToJerhyn = view.getUint16(filePosition);

		var radamentsLair = view.getUint16(filePosition);

		quests["Radament's Lair"] = getCommonQuestData(radamentsLair);

		quests["Radament's Lair"].foundRadament = isBitNSet(radamentsLair, 4);

		var theHoradricStaff = view.getUint16(filePosition);

		quests["The Horadric Staff"] = getCommonQuestData(theHoradricStaff);

		quests["The Horadric Staff"].getViperAmulet = isBitNSet(theHoradricStaff, 4);

		quests["The Horadric Staff"].getStaffOfKings = isBitNSet(theHoradricStaff, 5);

		quests["The Horadric Staff"].getHoradricStaff = isBitNSet(theHoradricStaff, 10);

		quests["The Horadric Staff"].gotHoradricStaff = isBitNSet(theHoradricStaff, 11);

		var taintedSun = view.getUint16(filePosition);

		quests["Tainted Sun"] = getCommonQuestData(taintedSun);

		quests["Tainted Sun"].sunIsDark = isBitNSet(taintedSun, 2);

		quests["Tainted Sun"].talkedToDrognan = isBitNSet(taintedSun, 3);

		var arcaneSanctuary = view.getUint16(filePosition);

		quests["Arcane Sanctuary"] = getCommonQuestData(arcaneSanctuary);

		var theSummoner = view.getUint16(filePosition);

		quests["The Summoner"] = getCommonQuestData(theSummoner);

		var theSevenTombs = view.getUint16(filePosition);

		quests["The Seven Tombs"] = getCommonQuestData(theSevenTombs);

		quests["The Seven Tombs"].spokeToTyrael = isBitNSet(theSevenTombs, 3);

		quests["The Seven Tombs"].spokeToJerhyn = isBitNSet(theSevenTombs, 4);

		quests["The Seven Tombs"].killedDuriel = isBitNSet(theSevenTombs, 5);

		quests["The Seven Tombs"].congratulatedByAtma = isBitNSet(theSevenTombs, 6);

		quests["The Seven Tombs"].congratulatedByWarriv = isBitNSet(theSevenTombs, 7);

		quests["The Seven Tombs"].congratulatedByDrognan = isBitNSet(theSevenTombs, 8);

		quests["The Seven Tombs"].congratulatedByLysander = isBitNSet(theSevenTombs, 9);

		quests["The Seven Tombs"].congratulatedByCain = isBitNSet(theSevenTombs, 10);

		quests["The Seven Tombs"].congratulatedByFara = isBitNSet(theSevenTombs, 11);


		return quests;
	}

	function questsActIII(filePosition) {
		var quests = {
			"Lam Esen's Tome": {},
			"Khalim's Will": {},
			"Blade of the Old Religion": {},
			"The Golden Bird": {},
			"The Blackened Temple": {},
			"The Guardian": {}
		};
		
		var hasTraveledToAct3 = view.getUint16(filePosition) > 0;

		_debug('has traveled to act 3?', hasTraveledToAct3);

		var introducedToHratli = view.getUint16(filePosition);

		/*,0	Lam Esen's Tome	
1	Khalim's Will
2	Blade of the Old Religion	Bit 2 is set when you pick up the Gidbinn.
Bit 3 is set when Hratli asks you to find the Gidbinn.
3	The Golden Bird	Bit 2 is set when Cain tells you about the Jade Figurine.
Bit 4 is set when Cain tells you about the Golden Bird.
Bit 5 is set when you are given the Potion of Life, and cleared again when you drink the Potion. (This prevents you from drinking more than one in a game.)
Bit 6 is set when you find the Jade Figurine.
4	The Blackened Temple	
5	The Guardian*/

		var lamEsensTome = view.getUint16(filePosition);

		quests["Lam Esen's Tome"] = getCommonQuestData(lamEsensTome);

		var khalimsWill = view.getUint16(filePosition);

		quests["Khalim's Will"] = getCommonQuestData(khalimsWill);

		var bladeOfTheOldReligion = view.getUint16(filePosition);

		quests["Blade of the Old Religion"] = getCommonQuestData(bladeOfTheOldReligion);

		quests["Blade of the Old Religion"].pickedUpTheGidbinn = isBitNSet(bladeOfTheOldReligion, 2);

		quests["Blade of the Old Religion"].askedByHratli = isBitNSet(bladeOfTheOldReligion, 3);

		var theGoldenBird = view.getUint16(filePosition);

		quests["The Golden Bird"] = getCommonQuestData(theGoldenBird);

		var theBlackenedTemple = view.getUint16(filePosition);

		quests["The Blackened Temple"] = getCommonQuestData(theBlackenedTemple);

		var theGuardian = view.getUint16(filePosition);

		quests["The Guardian"] = getCommonQuestData(theGuardian);

		return quests;
	}

	function questsActIV(filePosition) {
		var quests = {
			"The Fallen Angel": {},
			"Terror's End": {},
			"Hell's Forge": {}
		};

		var hasTraveledToAct4 = view.getUint16(filePosition) > 0;

		_debug('has traveled to act 4?', hasTraveledToAct4);

		var introducedToAct = view.getUint16(filePosition);

		var theFallenAngel = view.getUint16(filePosition);

		quests["The Fallen Angel"] = getCommonQuestData(theFallenAngel);

		var terrorsEnd = view.getUint16(filePosition);

		quests["Terror's End"] = getCommonQuestData(terrorsEnd);

		var hellsForge = view.getUint16(filePosition);

		quests["Hell's Forge"] = getCommonQuestData(hellsForge);


		filePosition.add(0, 16 * 3); // Next 3 shorts are unused

		return quests;
	}

	/*0	Siege on Harrogath	Bit 3 is set when you find Shenk.
Bit 5 is set when Larzuk offers to socket an item for you.
1	Rescue on Mount Arreat	
2	Prison of Ice	Bit 7 is set when you read the Scroll of Resistance.
Bit 8 is set after you rescue Anya and talk to Malah.
3	Betrayal of Harrogath	Bit 4 is set when Anya offers to personalize an item for you.
4	Rite of Passage	
5	Eve of Destruction	Bit 4 is set when Larzuk congratulates you.
Bit 5 is set when Cain congratulates you.
Bit 6 is set when Malah congratulates you.
Bit 7 is set by Tyrael.
Bit 8 is set by Qual-Kehk.
Bit 9 is set by Anya.*/

	function questsActV(filePosition) {
		var quests = {
			"Siege on Harrogath": {},
			"Rescue on Arreat": {},
			"Prison of Ice": {},
			"Betrayal of Harrogath": {},
			"Rite of Passage": {},
			"Eve of Destruction": {}
		};

		var hasTraveledToAct5 = view.getUint16(filePosition) > 0;

		filePosition.add(2); // 1 short, unknown use--"in an Expansion character, this was set to 1 after completing Terror's End and talking to Cain in act IV."

		filePosition.add(0, 2 * 16); // unknown 2 shorts

		_debug('has traveled to act 5?', hasTraveledToAct5);

		var siegeOnHarrogath = view.getUint16(filePosition);

		quests["Siege on Harrogath"] = getCommonQuestData(siegeOnHarrogath);

		var resuceOnArreat = view.getUint16(filePosition);

		quests["Rescue on Arreat"] = getCommonQuestData(resuceOnArreat);

		var prisonOfIce = view.getUint16(filePosition);

		quests["Prison of Ice"] = getCommonQuestData(prisonOfIce);

		var betrayalOfHarrogath = view.getUint16(filePosition);

		quests["Betrayal of Harrogath"] = getCommonQuestData(betrayalOfHarrogath);

		var riteOfPassage = view.getUint16(filePosition);

		quests["Rite of Passage"] = getCommonQuestData(riteOfPassage);

		var eveOfDestruction = view.getUint16(filePosition);

		quests["Eve of Destruction"] = getCommonQuestData(eveOfDestruction);

		return quests;
	}

	function parseQuestData(filePosition) {
		var quests = {
			normal: [],
			nightmare: [],
			hell: []
		};

		console.log('Parsing normal quests (filePosition:', filePosition, ')');

		quests.normal[0] = questsActI(filePosition);

		quests.normal[1] = questsActII(filePosition);

		quests.normal[2] = questsActIII(filePosition);

		quests.normal[3] = questsActIV(filePosition);

		quests.normal[4] = questsActV(filePosition);

		position.add(0, 16 * 7); // unknown 7 shorts

		console.log('Parsing nightmare quests (filePosition:', filePosition, ')');

		quests.nightmare[0] = questsActI(filePosition);

		quests.nightmare[1] = questsActII(filePosition);

		quests.nightmare[2] = questsActIII(filePosition);

		quests.nightmare[3] = questsActIV(filePosition);

		quests.nightmare[4] = questsActV(filePosition);

		position.add(0, 16 * 7); // unknown 7 shorts

		console.log('Parsing hell quests (filePosition:', filePosition, ')');

		quests.hell[0] = questsActI(filePosition);

		quests.hell[1] = questsActII(filePosition);

		quests.hell[2] = questsActIII(filePosition);

		quests.hell[3] = questsActIV(filePosition);

		quests.hell[4] = questsActV(filePosition);

		filePosition.add(0, 16 * 7); // unknown 7 shorts
		
		return quests;
	}	

	function parseActWaypoints(filePosition, actNumber) {
		var waypoints = {};

		var waypointNames = WAYPOINT_NAMES[actNumber - 1];

		var waypointData = view.getBits(filePosition, waypointNames.length);

		// _debug('--getBits with ' + waypointNames.length +' bits put us at', filePosition);

		_debug('Waypoint data for act ' + actNumber + ':', _zeroPadBinary(waypointData, waypointNames.length));

		var i, len = waypointNames.length;

		for (i = 0; i < len; i++) {
			waypoints[waypointNames[i]] = isBitNSet(waypointData, i);
		}

		return waypoints;
	}

	function parseWaypointData(filePosition) {
		var waypoints = {
			normal: [],
			nightmare: [],
			hell: []
		};

		var difficultyNames = Object.keys(waypoints);

		var i, len = 5;

		var difficultyIndex, difficultyName, difficultiesLength = difficultyNames.length;

		for (difficultyIndex = 0; difficultyIndex < difficultiesLength; difficultyIndex++) {
			difficultyName = difficultyNames[difficultyIndex];

			_debug('Parsing ' + difficultyName + ' waypoints data');

			filePosition.add(2); // unknown 2 bytes

			for (i = 1; i <= len; i++) {
				waypoints[difficultyName].push(parseActWaypoints(filePosition, i));

				_debug('After parsing act ' + i + ' in ' + difficultyName + ' we are at:', filePosition);
			}

			_debug('After parsing all acts in ' + difficultyName + ' we are at:', filePosition);

			filePosition.add(17); // unknown 17 bytes

		}

		return waypoints;
	}

	var fileId = view.getBits(position, 32);

	_debug('position (fileId):', position);

	if (fileId !== ID_VALUES.fileId) {
		throw new Error('Invalid file ID: 0x' + fileId.toString(16)
			+ ' (must be 0x' + ID_VALUES.fileId.toString(16) + ')');
	}

	_debug('fileId:', fileId.toString(16));

	var fileVersion = view.getBits(position, 32);

	_debug('position (fileVersion):', position);

	_debug('File version:', '0x' + fileVersion.toString(16));

	var fileSize = view.getBits(position, 32);

	_debug('position (fileSize):', position);

	_debug('File size:', fileSize + ' (' + (fileSize / (1024 * 1024)) + 'MB)');

	var checksum = view.getBits(position, 32);

	_debug('position (checksum):', position);

	_debug('checksum:', '0x' + checksum.toString(16));

	var activeArms = view.getBits(position, 32);

	_debug('position (activeArms):', position);

	_debug('activeArms:', '0x' + activeArms.toString(16));

	characterData.characterName = view.getString(position, 16);

	_debug('position (characterName):', position);

	_debug('Character name:', characterData.characterName);

	var characterStatus = view.getUint8(position);

	_debug('position (characterStatus):', position);

	_debug('characterStatus:', characterStatus.toString(2));

	var characterProgression = view.getUint8(position);

	_debug('position (characterProgression):', position);

	_debug('characterProgression: ', characterProgression.toString(2));

	position.add(2);

	_debug('position (unkown two bytes):', position);

	var characterClassId = view.getUint8(position);

	_debug('position (characterClassId):', position);

	characterData.characterClass = CHARACTER_CLASSES[characterClassId];

	_debug('Character class:', characterData.characterClass + " (" + characterClassId.toString(2) + ")");

	position.add(2); // Unknown purpose

	characterData.level = view.getUint8(position);

	_debug('level:', characterData.level);

	position.add(4); // Unknown

	var timeStamp =  view.getBits(position, 32);

	_debug('timestamp:', timeStamp + ' (' + new Date(timeStamp) + ')');

	position.add(4); // Unknown

	var hotkeySkills = [];

	var i;

	for (i = 0; i < 16; i++) {
		hotkeySkills.push(view.getBits(position, 32));
	}

	_debug('hotkeySkills:', hotkeySkills);

	var leftButtonSkill = view.getBits(position, 32);

	_debug('leftButtonSkill:', leftButtonSkill);

	var rightButtonSkill = view.getBits(position, 32);

	_debug('rightButtonSkill:', rightButtonSkill);

	var altLeftButtonSkill = view.getBits(position, 32);

	_debug('altLeftButtonSkill:', altLeftButtonSkill);

	var altRightButtonSkill = view.getBits(position, 32);

	_debug('altRightButtonSkill:', altRightButtonSkill);

	position.add(32);

	var normalInfo = view.getUint8(position);
	var nightmareInfo = view.getUint8(position);
	var hellInfo = view.getUint8(position);

	_debug('normalInfo:', _zeroPadBinary(normalInfo, 8));
	_debug('nightmareInfo:', _zeroPadBinary(nightmareInfo, 8));
	_debug('hellInfo:', _zeroPadBinary(hellInfo, 8));

	var mapId = view.getBits(position, 32);

	_debug('mapId:', mapId);

	position.add(2);

	var deadMerc = view.getUint16(position);

	var mercId = view.getBits(position, 32);

	var mercNameId = view.getUint16(position);

	var mercData = view.getUint16(position);

	var mercXP = view.getBits(position, 32);

	_debug('merc data:', {
		id: mercId,
		nameId: mercNameId,
		data: mercData,
		xp: mercXP
	});

	position.add(144); // Unknown


	_debug('--Parsing quest data--');

	var questSectionId = view.getString(position, 4);

	if (questSectionId !== ID_VALUES.questsHeaderId) {
		throw new Error('Quest section header must be "' + ID_VALUES.questsHeaderId + '" (was ' + questSectionId + ')');
	}

	position.add(6);

	var quests = parseQuestData(position);

	// _debug('quests:', JSON.stringify(quests, null, "\t"));

	var waypointSectionId = view.getString(position, 2);

	if (waypointSectionId !== ID_VALUES.waypointSectionId) {
		throw new Error('Waypoints section header ID must be "' + ID_VALUES.waypointSectionId + '" (was ' + waypointSectionId + ')');
	}

	position.add(6); // unknown 6 bytes

	_debug('Parsing waypoint data starting from', position);

	var waypoints = parseWaypointData(position);

	_debug('waypoints:', JSON.stringify(waypoints, null, "\t"));

	_debug('Position:', position);

	return new Character(characterData);
};

exports = module.exports = CharacterViewer;