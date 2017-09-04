'use strict';
require('./support/setup.js');
const vars = require('./support/variables.js');
const expect = require('chai').expect;

/* Variables */
const pName = vars.pName;
const pDir = vars.pDir;
const pNot = vars.pNot;
const pNew = vars.pNew;

const Project = require('../src/Project.js');

describe('Project', () => {

  /***************/
  /* Constructor */
  /***************/

  describe('constructor', () => {
    it('throws if missing arguments', () => {
      expect(() => new Project(pName)).to.throw(Error);
    });
    it('works if arguments ok', () => {
      expect(() => new Project(pName, pDir)).to.not.throw(Error);
    });
    it('creates a directory if it doesnt exist yet', () => {
      new Project(pName, pDir);
      expect(pDir).to.be.a.directory();
    });
  });

  /*******************/
  /* Regular methods */
  /*******************/

  describe('moveTo', () => {
    it('throws if missing arguments', () => {
      expect(() => new Project(pName, pDir).moveTo()).to.throw(TypeError);
    });
    it('fails if directory is tampered with', () => {
      let p = new Project(pName, pDir);
      p.directory = pNot;
      return p.moveTo(pNew).should.be.rejected;
    });
    /*
    it('fails if no rights', () => {
      return new Project(pName, pDir).moveTo(pNot).should.be.rejected;
    });
    */
    it('works', () => {
      let p = new Project(pName, pDir);
      let dir = p.directory;
      p.moveTo(pNew).then(() => {
        expect(dir).to.not.be.a.directory();
        expect(pNew).to.be.a.directory();
      });
    });
  });

  describe('include', () => {
    it('fails if missing arguments', () => {
      return new Project(pName, pDir).include().should.be.rejected;
    });
    it('fails if boilerplate does not exist', () => {
      return new Project(pName, pDir).include(pNot).should.be.rejected;
    });
    it('fails if directory is tampered with', () => {
      let p = new Project(pName, pDir);
      p.directory = pNot;
      return p.moveTo('/new/path').should.be.rejected;
    });
  });

  describe('delete', () => {
    it('works even if directory is tampered with', () => {
      let p = new Project(pName, pDir);
      p.directory = pNot;
      return p.delete().should.be.fulfilled;
    });
    it('works', () => {
      let p = new Project(pName, pDir);
      p.delete().then(() => {
        expect(p.dir).to.not.be.a.directory();
      });
    });
  });

  /***************/
  /* Git methods */
  /***************/
  /*
  describe('gitEnable', () => {
    it('fails if git is already enabled', () => {
      return new Project(pName, pDir).gitEnable().should.be.rejected;
    });
    it('fails if boilerplate does not exist', () => {
      return new Project(pName, pDir).include(pNot).should.be.rejected;
    });
    it('fails if directory is tampered with', () => {
      let p = new Project(pName, pDir);
      p.directory = pNot;
      return p.moveTo('/new/path').should.be.rejected;
    });
  });
  */
});
