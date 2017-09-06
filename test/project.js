'use strict';
require('./support/setup.js');
const fs = require('fs-extra');
const vars = require('./support/variables.js');
const path = require('path');
const expect = require('chai').expect;

/* Variables */
const pName = vars.pName;
const pDir = vars.pDir;
const pNot = vars.pNot;
const pNew = vars.pNew;

const Project = require('../src/Project.js');

describe('Project', () => {

  /* FIXME: beforeEach EPERM/EBUSY errors */
  beforeEach(() => { fs.emptyDirSync(vars.fixture); });
  afterEach(() => { fs.emptyDirSync(vars.fixture); });

  /***************/
  /* Constructor */
  /***************/

  describe('constructor', () => {
    it('throws if missing arguments', () => {
      expect(() => new Project(pName)).to.throw(Error);
    });
    it('throws if directory not absolute', () => {
      expect(() => new Project(pName, 'somedir')).to.throw(Error);
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
    it('works if arguments ok', () => {
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
    it('fulfilled even if directory is tampered with', () => {
      let p = new Project(pName, pDir);
      p.directory = pNot;
      return p.delete().should.be.fulfilled;
    });
    /* FIXME: expect does not seem to work on directory deletion
    it('works if arguments ok', () => {
      return new Project(pName, pDir).delete().then(() => {
        expect(pDir).to.not.be.a.directory();
      });
    });
    */
  });

  /***************/
  /* Git methods */
  /***************/

  describe('gitEnable', () => {
    it('creates a .git directory', () => {
      new Project(pName, pDir).gitEnable().then(() => {
        expect(path.join(pDir, '.git')).to.be.a.directory();
      });
    });
    /* FIXME: Does not seem to work */
    it('sets git.enabled to true', () => {
      let p = new Project(pName, pDir);
      expect(p.gitEnable()).to.eventually.have.deep.property('git.enabled', true);
    });
    it('fulfilled', () => {
      return new Project(pName, pDir).gitEnable().should.be.fulfilled;
    });
  });

  describe('gitDisable', () => {
    it('deletes the .git directory', () => {
      new Project(pName, pDir).gitDisable().then(() => {
        expect(path.join(pDir, '.git')).to.be.a.directory();
      });
    });
    /* FIXME: Does not seem to work */
    it('sets git.enabled to false', () => {
      let p = new Project(pName, pDir);
      expect(p.gitDisable()).to.eventually.have.deep.property('git.enabled', false);
    });
    it('fulfilled', () => {
      return new Project(pName, pDir).gitDisable().should.be.fulfilled;
    });
  });

  describe('gitRemoteAdd', () => {
    it('fails if is not a git directory', () => {
      return new Project(pName, pDir).gitRemoteAdd('origin', 'http://caca').should.be.rejected;
    });
  });

  describe('gitRemoteRemove', () => {
    it('fails if not a git repository', () => {
      return new Project(pName, pDir).gitRemoteRemove('origin').should.be.rejected;
    });
    it('fails if remote doesnt exist', () => {
      let p = new Project(pName, pDir);
      return p.gitEnable().then(() => {
        return p.gitRemoteRemove('origin').should.be.rejected;
      });
    });
  });

});
