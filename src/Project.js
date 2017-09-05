'use strict';

const fs = require('fs-extra');
const git = require('simple-git')();
const path = require('path');
const GitApi = require('./GitApi.js');

class Project {

  /***************/
  /* Constructor */
  /***************/

  constructor (name, directory) {
    if (!name || !directory)
      throw new Error('Missing mandatory arguments name and directory');
    if (!path.isAbsolute(directory))
      throw new Error('Project path must be absolute');
    fs.ensureDirSync(directory);
    this.name = name;
    this.directory = directory;
    this.git = {
      enabled: false,
      remotes: {},
    };
  }

  /*******************/
  /* Regular methods */
  /*******************/

  moveTo (destination) {
    let newdir = path.join(destination, path.basename(this.directory));

    return fs.move(this.directory, newdir)
            .then(() => {
              this.directory = newdir;
            });
  }

  include (boilerplate) {
    return fs.copy(boilerplate, this.directory);
  }

  delete () {
    return fs.remove(this.directory);
  }

  /***************/
  /* Git methods */
  /***************/

  gitEnable () {
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .init((err) => {
          if (err) {
            reject();
          } else {
            this.git.enabled = true;
            resolve();
          }
        });
    });
  }

  gitDisable () {
    return fs.remove(path.join(this.directory, '.git'))
            .then(() => {
              this.git.enabled = false;
            });
  }

  gitRemoteAdd (remote, url) {
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .addRemote(remote, url, (err) => {
          if (err) {
            reject();
          } else {
            this.git.remotes[remote] = { url: url };
            resolve();
          }
        });
    });
  }

  gitRemoteRemove (remote) {
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .removeRemote(remote, (err) => {
          if (err) {
            reject();
          } else {
            delete this.git.remotes[remote];
            resolve();
          }
        });
    });
  }

  gitRemotePull (remote) {
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .pull(remote, (err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }

  /***********/
  /* Git API */
  /***********/

  gitCreateRepository(username, password, options) {
    return new Promise((resolve, reject) => {
      let api = new GitApi(this.git.api);

      options = options || {};
      api.authenticate(username, password)
        .create(this.name, {
          description: this.description,
          legacyUsername: options.legacyUsername,
        })
        .then((url) => {
          if (options.addRemoteAs && typeof options.addRemoteAs === 'string') {
            this.gitRemoteAdd(options.addRemoteAs, url).then(resolve).catch(reject);
          } else {
            resolve();
          }
        }).catch(reject);
    });
  }

  gitDeleteRepository(username, password, options) {
    return new Promise((resolve, reject) => {
      let api = new GitApi(this.git.api);

      options = options || {};
      api.authenticate(username, password)
        .delete(this.name, { })
        .then(resolve).catch(reject);
    });
  }

}

module.exports = Project;
