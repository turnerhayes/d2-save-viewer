var fs = require('fs');

var classNames = ['Amazon', 'Sorceress', 'Necromancer', 'Paladin', 'Barbarian', 'Druid', 'Assassin'];

var CharacterViewer = function(filename) {
	console.log('filename', filename);
	fs.readFile(filename, function(err, data) {
		if (err) {
			console.error(err);
			return;
		}

		var ab = new ArrayBuffer(data.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < data.length; ++i) {
			view[i] = data[i];
		}
		
		var dataView = new DataView(ab);

		var name = data.slice(20, 36);
		console.log('name:', name.toString('ascii'));

		var classid = data[40];

		var className = classNames[classid];

		console.log('class:', className);

		var level = data[43];

		console.log('level:', level);

		var progress = {
			normal: data.readUInt8(168),
			nightmare: data.readUInt8(169),
			hell: data.readUInt8(170)
		};

		var difficulty,
			isActive,
			act;

		for (difficulty in progress) {
			isActive = progress[difficulty] >> 7;
			act = (progress[difficulty] & 31) + 1; // act is 0-based
			console.log(difficulty + ' progress', progress[difficulty]);
			console.log(difficulty + ' bits', Number.prototype.toString.call(progress[difficulty], 2));
			console.log("\tisActive:", isActive);
			console.log("\tact:", act);
		}

		var statIndex = 767;

		var statDescription = data.readUInt16LE(statIndex);

		console.log('statDescription:', Number.prototype.toString.call(statDescription, 2));

		console.log('statDescription anded:', statDescription & 511);

		var statName = data.slice(statIndex, statIndex + 9).toString('ascii');

		console.log('statName:', statName);
	})
};

exports = module.exports = CharacterViewer;