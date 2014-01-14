var fs = require('fs');

var D2DataView = function(arrayBuffer) {
	var d2view = this;

	d2view.dataView = new DataView(arrayBuffer);
};

D2DataView.prototype.slice = function(filePosition, endPosition, options) {
	var d2view = this;

	options = options || {};

	var valArray = [];

	var i;

	if (!endPosition.isFilePosition) {
		endPosition = filePosition.clone().add(endPosition);
	}

	for (i = filePosition.bytes; i < endPosition.bytes; i++) {
		valArray.push(d2view.dataView.getUint8(i));
	}

	if (!options.skipPositionUpdate) {
		filePosition.add(endPosition);
	}

	return valArray;
};

D2DataView.prototype.getUint8 = function(filePosition, options) {
	var d2view = this;

	options = options || {};

	var value = d2view.getBits(filePosition, 8);

	if (!options.skipPositionUpdate) {
		filePosition.add(0, 8);
	}

	return value;
};

D2DataView.prototype.getUint16 = function(filePosition, options) {
	var d2view = this;

	options = options || {};

	var value = d2view.getBits(filePosition, 16);

	if (!options.skipPositionUpdate) {
		filePosition.add(0, 16);
	}

	return value;
}

D2DataView.prototype.getString = function(filePosition, length) {
	var d2view = this;

	var bytes = d2view.slice(filePosition, length);

	var chars = [];

	var i, len;

	for (i = 0, len = bytes.length; i < len; i++) {
		chars.push(String.fromCharCode(bytes[i]));
	}

	return chars.join('');
};

D2DataView.prototype.getBits = function(filePosition, numberOfBits) {
	var d2view = this;

	var byteCount = Math.ceil(numberOfBits / 8);

	var bytes = d2view.slice(filePosition, byteCount);

	var i, len, currentByte, byteIndex, bit;

	var result = 0;

	var currentBitResult, currentBitResultLength;

	var bitCount = 0;

	for (i = bytes.length - 1, len = bytes.length; i >= 0; i--) {
		currentByte = bytes[i];
		currentBitResult = 0;
		currentBitResultLength = 0;
		console.log('currentByte:', currentByte + " (" + Number.prototype.toString.call(currentByte, 2) + ") (0x" + Number.prototype.toString.call(currentByte, 16) + ")");

		byteIndex = 0;

		if (filePosition.bits > 0 && i === 0) {
			byteIndex += filePosition.bits;
		}

		for (; byteIndex < 8; byteIndex++) {			
			if (bitCount === numberOfBits) {
				break;
			}

			bit = (currentByte >> byteIndex) & 1 ;

			console.log('BIT:', bit);

			// result = result | (bit << byteIndex);

			console.log('currentBitResult:', Number.prototype.toString.call(currentBitResult, 2));

			bitCount++;
			currentBitResultLength++;
			currentBitResult = currentBitResult | (bit << byteIndex);
		}

		if (currentBitResultLength > 0) {
			result = (result << currentBitResultLength) | currentBitResult;

			console.log('result:', Number.prototype.toString.call(result, 2));
		}

		if (bitCount === numberOfBits) {
			break;
		}
	}

	console.log('Final result:', Number.prototype.toString.call(result, 2) + ' (0x' + Number.prototype.toString.call(result, 16) + ')');

	return result;
};

var classNames = ['Amazon', 'Sorceress', 'Necromancer', 'Paladin', 'Barbarian', 'Druid', 'Assassin'];

var CharacterViewer = function(filename) {
	var characterViewer = this;

	// console.log('filename', filename);
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

		return;

		var attribute1 = view.getBits(767, 9);

		console.log('attribute header:', data.slice(765, 767).toString('binary'));

		console.log('attribute1 bytes:', data.slice(767, 769));

		console.log('attribute1:', attribute1);

		(function() {
			var attribute1Padded = Number.prototype.toString.call(attribute1, 2);

			var zeros = (Math.pow(10, 9 - attribute1Padded.length) + "").substring(1);

			if (zeros.length > 0) {
				attribute1Padded = zeros + attribute1Padded;
			}

			console.log('attribute1 (padded):', attribute1Padded);
		}());

		var name = data.slice(20, 36);
		console.log('name bytes:', name);

		var nameText = view.getString(20, 16);
		console.log('name:', nameText);

		var classid = data[40];

		var className = classNames[classid];

		// console.log('class:', className);

		var level = data[43];

		// console.log('level:', level);

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
			// console.log(difficulty + ' progress', progress[difficulty]);
			// console.log(difficulty + ' bits', Number.prototype.toString.call(progress[difficulty], 2));
			// console.log("\tisActive:", isActive);
			// console.log("\tact:", act);
		}

		var statIndex = 767;

		var statDescription = data.readUInt16LE(statIndex);

		// console.log('statDescription:', Number.prototype.toString.call(statDescription, 2));

		// console.log('statDescription anded:', statDescription & 511);

		var statName = data.slice(statIndex, statIndex + 9).toString('ascii');

		// console.log('statName:', statName);
	})
};

CharacterViewer.prototype.parseFileData = function(view) {
	var characterViewer = this;

	var position = new FilePosition();

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

	var fileId = view.getBits(position, 32);

	if (fileId !== CharacterViewer.validFileId) {
		throw new Error('Invalid file ID: 0x' + Number.prototype.toString.call(fileId, 16)
			+ ' (must be 0x' + Number.prototype.toString.call(CharacterViewer.validFileId, 16) + ')');
	}

	console.log('fileId:', Number.prototype.toString.call(fileId, 16));
};

CharacterViewer.attributeTable = {
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

CharacterViewer.validFileId = 0xAA55AA55;

var FilePosition = function(bytes, bits) {
	var filePosition = this;

	filePosition.bytes = bytes || 0;
	filePosition.bits = bits || 0;

	filePosition.isFilePosition = true;
};

FilePosition.prototype.clone = function() {
	var filePosition = this;

	return new FilePosition(filePosition.bytes, filePosition.bits);
};

FilePosition.prototype.add = function(bytes, bits) {
	var filePosition = this;

	var newFilePosition;

	if (bytes.isFilePosition) {
		newFilePosition = bytes;
		bytes = newFilePosition.bytes;
		bits = newFilePosition.bits + (bits || 0);
	}

	filePosition.bytes += bytes || 0;

	if (bits) {
		filePosition.bytes += Math.floor(bits / 8);
		filePosition.bits += bits % 8;
	}

	return filePosition;
};

exports = module.exports = CharacterViewer;