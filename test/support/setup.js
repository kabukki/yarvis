'use strict';
const chai = require('chai');
const chaiFs = require('chai-fs');
const chaiAsPromised = require('chai-as-promised');

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiFs);
