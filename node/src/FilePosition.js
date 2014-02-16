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

exports = module.exports = FilePosition;