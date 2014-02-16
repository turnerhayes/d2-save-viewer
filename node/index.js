var CharacterViewer = require('./src/CharacterViewer');

var files = ['Hyppolita', 'Ataturk', 'MXL/Ataturk', 'MXLU/Aria_Tloak'];

var fileIndex = process.argv[2];
console.log('fileIndex', fileIndex);

if (fileIndex == null) {
	fileIndex = 0;
}
else {
	fileIndex = parseInt(fileIndex, 10);
}

var charFile = files[fileIndex];

console.log('Character file:', 'test/' + charFile + '.d2s');

var viewer = new CharacterViewer('test/' + charFile + '.d2s');