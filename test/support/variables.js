'use strict';
const path = require('path');
const fixture = path.resolve(path.join(__dirname, '../fixture'));

module.exports.pName = 'A';
module.exports.pDir = path.join(fixture, 'a');
module.exports.pNot = path.join(fixture, 'this/path/does/not/exist');
module.exports.pNew = path.join(fixture, 'new/path');
module.exports.fixture = fixture;
