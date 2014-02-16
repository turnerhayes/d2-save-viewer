exports = module.exports = {
	zeroPadBinary: function(number, padTo) {
		var binString = number.toString(2);

		while (binString.length < padTo) {
			binString = '0' + binString;
		}

		return binString;
	},

	debug: function() {
		if (process.env.NODE_DEBUG) {
			console.log.apply(console, arguments);
		}
	}
};
