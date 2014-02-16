var _debug, _zeroPadBinary, debugUtils;

if (process.env.NODE_ENV === 'development') {
	debugUtils = require('./DebugUtils');

	_debug = debugUtils.debug;
	_zeroPadBinary = debugUtils.zeroPadBinary;
}
else {
	_debug = _zeroPadBinary = function() { return '' };
}


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

	var end = endPosition.bytes;

	if (endPosition.bits > 0) {
		// If there are some extra bits, we need the next byte as well
		end += 1;
	}

	for (i = filePosition.bytes; i < end; i++) {
		valArray.push(d2view.dataView.getUint8(i));
	}

	if (!options.skipPositionUpdate) {
		filePosition.bytes = endPosition.bytes;
		filePosition.bits = endPosition.bits;
	}

	return valArray;
};

D2DataView.prototype.getUint8 = function(filePosition, options) {
	var d2view = this;

	options = options || {};

	var value = d2view.getBits(filePosition, 8, { skipPositionUpdate: true });

	if (!options.skipPositionUpdate) {
		filePosition.add(0, 8);
	}

	return value;
};

D2DataView.prototype.getUint16 = function(filePosition, options) {
	var d2view = this;

	options = options || {};

	var value = d2view.getBits(filePosition, 16, { skipPositionUpdate: true });

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

	return chars.join('').replace("\0", '');
};

D2DataView.prototype.getBits = function(filePosition, numberOfBits, options) {
	var d2view = this;

	if (numberOfBits > 32) {
		throw new Error('getBits currently cannot support bit lengths longer than 32 (they cannot fit in a JS integer)');
	}

	options = options || {};

	var bytes = d2view.slice(filePosition, filePosition.clone().add(0, numberOfBits), { skipPositionUpdate: true });

	if (numberOfBits % 8 > 0) {
		_debug('bytes:', bytes);
	}

	var i, len, currentByte, byteIndex, bit;

	var result = 0;

	var currentBitResult, currentBitResultLength;

	var runningBitCount = 0;

	for (i = bytes.length - 1; i >= 0; i--) {
		currentByte = bytes[i];
		currentBitResult = 0;
		currentBitResultLength = 0;
		
		byteIndex = 0;

		if (numberOfBits % 8 > 0 && i === 0) {
			byteIndex += numberOfBits % 8;
		}

		for (; byteIndex < 8; byteIndex++) {			
			if (runningBitCount === numberOfBits) {
				break;
			}

			bit = (currentByte >> byteIndex) & 1;

			// DEBUG
			if (numberOfBits % 8 > 0) {
				_debug('Bit:', bit);
			}

			currentBitResultLength++;
			runningBitCount++;
			currentBitResult = currentBitResult | (bit << byteIndex);
		}

		if (currentBitResultLength > 0) {

			_debug(
				'Shifting ' + _zeroPadBinary(result, runningBitCount - currentBitResultLength) + ' ' + currentBitResultLength + ' bits' +
				' and adding ' + _zeroPadBinary(currentBitResult, currentBitResultLength)
			);

			// Javascript's << operator operates only on signed 32-bit integers. >>> operates on unsigned 32-bit integers.
			// So >>> 0 basically converts the value to a 32-bit unsigned integer.
			result = (((result << currentBitResultLength) >>> 0) | currentBitResult) >>> 0;


			// DEBUG
			if (numberOfBits % 8 > 0) {
				_debug('Result is now:', _zeroPadBinary(result, currentBitResultLength));
			}

		}

		if (runningBitCount === numberOfBits) {
			break;
		}
	}

	// DEBUG
	if (numberOfBits % 8 > 0) {
		_debug('Result:', _zeroPadBinary(result, numberOfBits));
	}

	if (!options.skipPositionUpdate) {
		filePosition.add(0, runningBitCount);
	}

	return result;
};


exports = module.exports = D2DataView;