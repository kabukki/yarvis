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
    /* Automatically detect git and its remotes. */
    if (fs.existsSync(path.join(this.directory, '.git'))) {
      this.git.enabled = true;
      git.cwd(this.directory)
        .getRemotes(true, (err, res) => {
          if (!err)
            res.forEach((remote) => {
              if (remote.name)
                this.git.remotes[remote.name] = remote.refs;
            });
        });
      }
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
    if (!remote || !url)
      throw new Error('Missing mandatory arguments remote and url');
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .addRemote(remote, url, (err) => {
          if (err) {
            reject();
          } else {
            this.git.remotes[remote] = { refs: { fetch: url, push: url } };
            resolve();
          }
        });
    });
  }

  gitRemoteRemove (remote) {
    if (!remote)
      throw new Error('Missing mandatory argument remote');
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

  gitRemotePull (remote, branch) {
    if (!remote || !branch)
      throw new Error('Missing mandatory arguments remote and branch');
    return new Promise((resolve, reject) => {
      git.cwd(this.directory)
        .pull(remote, branch, (err) => {
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
    if (!username || !password)
      throw new Error('Missing mandatory arguments username and password');
    return new Promise((resolve, reject) => {
      let api = new GitApi(this.git.api);

      options = options || {};
      api.authenticate(username, password)
        .create(username, this.name, {
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

  gitDeleteRepository(username, password) {
    if (!username || !password)
      throw new Error('Missing mandatory arguments username and password');
    return new Promise((resolve, reject) => {
      let api = new GitApi(this.git.api);

      api.authenticate(username, password)
        .delete(username, this.name)
        .then(resolve).catch(reject);
    });
  }

  gitAddCollaborator (username, password, collaborator, rights) {
    if (!username || !password || !collaborator || !rights)
      throw new Error('Missing mandatory arguments username, password, collaborator and rights');
    return new Promise((resolve, reject) => {
      let api = new GitApi(this.git.api);

      api.authenticate(username, password)
        .addCollaborator(username, this.name, collaborator, rights)
        .then(resolve).catch(reject);
    });
  }

}

module.exports = Project;
