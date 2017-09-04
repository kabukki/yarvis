'use strict';

const fs = require('fs-extra');
const path = require('path');
const Store = require('electron-store');
const moment = require('moment');
const git = require('simple-git')();
/* Git APIs */
const Blih = require('blih-api');
const GitHub = require('github');

const data = new Store({ name: 'data' });
const config = new Store({ name: 'config' }).store;

class ProjectManager {

  constructor (project) {
    Object.assign(this, project);
  }

  /* Check object integrity */
  check () {
    const minimalFields = [
      { name: 'name', message: 'No name specified' },
      { name: 'language', message: 'No language selected' },
      { name: 'directory', message: 'No directory specified' },
    ];

    /* Required fields */
    for (const field of minimalFields) {
      if (!this.hasOwnProperty(field.name)) {
        throw new Error(field.message);
      }
    }
    /* Check for name availability */
    if (data.store.projects.find(p => p.name === this.name)) {
      throw new Error('This name is already taken by another project');
    }
    /* Check if directory is absolute */
    if (!path.isAbsolute(this.directory)) {
      throw new Error('You must specify an absolute path to your project\'s directory.');
    }
    /* Check for directory availability */
    if (data.store.projects.find(p => p.directory === this.directory)) {
      throw new Error('This directory is already used by another project');
    }
    /* Check for dates consistency */
    if (this.deadline && moment(this.deadline).isBefore(this.start)) {
      throw new Error('The deadline cannot be after the start of the project.');
    }
    /* Check for git info consistency */
    if (this.git.repo !== 'none') {
      if (this.git.repo === 'new') {
        if (this.git.api) {
          // Info that will be sent to APIs.
          if (this.git.api === 'blih' && !this.git.legacyUsername)
            throw new Error('The "legacyUsername" field is mandatory to use the BLIH API.');
          if (!this.git.username || !this.git.password)
            throw new Error('You must provide credentials to create the repository.');
          if (this.git.api !== 'blih')
            delete this.git.legacyUsername;
        } else {
          throw new Error('You must specify an API to use to create the repository.');
        }
      } else if (this.git.repo === 'use') {
        if (!this.git.remote)
          throw new Error('No remote specified.');
      } else {
        throw new Error('Internal error.');
      }
    } else {
      delete this.git.api;
      delete this.git.username;
      delete this.git.legacyUsername;
      delete this.git.password;
    }
  }

  /* TODO - review: if add remote fails, repo & dir are still here . Use promises */
  create (callback) {
    this.createDirectory((err) => {
      if (err) {
        callback(err);
      } else {
        if (this.git.repo !== 'none') {
          if (this.git.repo === 'new') {
            this.createRepository((err) => {
              if (!err) {
                this.addRemote(() => {
                  this.save();
                  callback();
                });
              } else {
                callback(err);
              }
            });
          } else {
            this.updateRemote(() => {
              this.pullRemote(() => {
                this.save();
                callback();
              });
            });
          }
        } else {
          this.save();
          callback();
        }
      }
    });

  }

  /*
   * Create remote repository using git.api and sets git.remote accordingly.
   */
  createRepository (callback) {
    let api;
    switch (this.git.api) {
      case 'github':
        api = new GitHub();

        api.authenticate({
          type: config.git.apis.github.authentication,
          username: this.git.username,
          password: this.git.password,
        });
        api.repos.create({
          name: this.name,
          description: this.description,
        }).then((res) => {
          this.git.remote = res.data.clone_url;
          callback();
        }).catch((err) => {
          callback(err);
        });
        break;
      case 'blih':
        api = new Blih(this.git.username, this.git.password);

        api.createRepository(this.name, (err) => {
          if (!err) {
            this.git.remote = 'git@git.epitech.eu:/' + this.git.legacyUsername + '/' + this.name;
            callback();
          } else {
            callback(new Error(err));
          }
        });
        break;
      default:
        console.log('not creating any repo since API is unknown');
        break;
    }
  }

  createDirectory (callback) {
    if (this.boilerplate) {
      fs.copy(this.boilerplate.files.path, this.directory, { overwrite: false }, (err) => {
        delete this.boilerplate;
        callback(err);
      });
    } else {
      fs.ensureDir(this.directory, (err) => {
        callback(err);
      });
    }
  }

  /*
   * Add git.remote to the project
   */
  addRemote (callback) {
    git.cwd(this.directory)
      .init()
      .addRemote('origin', this.git.remote, callback);
  }

  /*
   * Update git.remote
   */
  updateRemote (callback) {
    git.cwd(this.directory)
      .removeRemote('origin')
      .addRemote('origin', this.git.remote, callback);
  }

  /*
   * Runs git pull origin master
   */
  pullRemote (callback) {
    git.cwd(this.directory)
      .pull('origin', 'master', callback);
  }

  /***********/
  /* Actions */
  /***********/

  move (callback, dest) {
    let newdir = path.join(dest, this.name);

    fs.move(this.directory, newdir)
      .then(() => {
        this.directory = newdir;
        this.save();
        callback();
      }).catch((err) => {
        callback(err);
      });
  }

  archive (callback) {
    this.active = false;
    this.move(callback, config.archives.directory);
  }

  unarchive (callback) {
    this.active = true;
    this.move(callback, config.projects.directory);
  }

  save () {
    let projects = data.get('projects');

    if (!projects.find(p => p.name === this.name)) {
      projects.push(this);
    } else {
      projects = projects.map(p => {
        if (p.name === this.name)
          Object.assign(p, this);
        return p;
      });
    }

    data.set('projects', projects);
  }

  forget (callback) {
    let projects = data.store.projects.filter(p => p.name != this.name);

    data.set('projects', projects);
    callback();
  }

  deleteLocal (callback) {
    fs.remove(this.directory, (err) => {
      if (!err)
        this.forget(callback);
      else
        callback(err);
    });
  }

  deleteGlobal (callback) {
    let api;

    if (!this.git.username || !this.git.password) {
      callback(new Error('Username and password are required to authenticate.'));
    } else {
      switch (this.git.api) {
        case 'github':
          api = new GitHub();

          api.authenticate({
            type: config.git.apis.github.authentication,
            username: this.git.username,
            password: this.git.password,
          });
          api.repos.delete({
            owner: this.git.username,
            repo: this.name,
          }).then(() => {
            this.deleteLocal(callback);
          }).catch((err) => {
            callback(err);
          });
          break;
        case 'blih':
          api = new Blih(this.git.username, this.git.password);

          api.deleteRepository(this.name, (err) => {
            if (!err) {
              this.deleteLocal(callback);
            } else {
              callback(new Error(err));
            }
          });
          break;
        default:
          callback(new Error('Cannot delete repository since this API is unknown'));
          break;
      }
    }
  }

}

module.exports = ProjectManager;
