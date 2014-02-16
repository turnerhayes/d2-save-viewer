var Character = function(options) {
	var character = this;

	character.name = options.name;
	character.level = options.level;
	character.characterClass = options.characterClass;
};

exports = module.exports = Character;
