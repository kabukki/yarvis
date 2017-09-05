'use strict';
require('./support/setup.js');
const expect = require('chai').expect;

const GitApi = require('../src/GitApi.js');

describe('GitApi', () => {

  /***************/
  /* Constructor */
  /***************/

  describe('constructor', () => {
    it('throws if missing arguments', () => {
      expect(() => new GitApi()).to.throw(Error);
    });
    it('throws if unsupported api', () => {
      expect(() => new GitApi('unknown')).to.throw(Error);
    });
    it('works if arguments ok', () => {
      expect(() => new GitApi('github')).to.not.throw(Error);
    });
  });

  /*******************/
  /* Regular methods */
  /*******************/

  describe('create', () => {
    it('fails if not authenticated first', () => {
      return new GitApi('blih')
              .create('A', {})
              .should.be.rejected;
    });
  });

});
