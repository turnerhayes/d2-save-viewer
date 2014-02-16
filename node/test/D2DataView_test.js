var D2DataView = require('../src/D2DataView');
var FilePosition = require('../src/FilePosition');

var _debug, _zeroPadBinary, debugUtils = require('../src/DebugUtils');

_debug = debugUtils.debug;
_zeroPadBinary = debugUtils.zeroPadBinary;

function reverseString(str) {
	var i = str.length, reversed = [];

	if (i === 0) {
		return str;
	}

	for(i = i -1; i >= 0; i--) {
		reversed.push(str[i]);
	}

	return reversed.join('');
}

var testDataBinString = '0101010110';

var testData = parseInt(testDataBinString, 2);

var buffer;

(function() {
	var i, len = Math.ceil(testDataBinString.length / 8);

	buffer = new ArrayBuffer(len);

	for (i = 0; i < len; i++) {
		buffer[i] = (testData >> (8 * i)) & 0xFF;
	}
}());

console.log('ArrayBuffer: ' + JSON.stringify(buffer, null, '\t'));

var view = new D2DataView(buffer);

var pos = new FilePosition(0, 0);

var bits = view.getBits(pos, 9);

console.log('Bits (' + _zeroPadBinary(bits, 9) + ') should be ' + reverseString(testDataBinString.substring(0, 9)));

