'use strict';

const fs = require('fs-extra');
const path = require('path');
const Project = require('./Project.js');

class ProjectManager {

  /***************/
  /* Constructor */
  /***************/

  constructor (file) {
    if (!file)
      throw new Error('Missing mandatory argument file');
    if (!path.isAbsolute(file))
      throw new Error('File path must be absolute');
    fs.ensureFileSync(file);
    this.file = file;
    this.projects = fs.readJsonSync(file, { throws: false }) || [];
  }

  /*******************/
  /* Regular methods */
  /*******************/

  addProject (project) {
    if (!project)
      throw new Error('Missing mandatory argument project');
    if (!(project instanceof Project))
      throw new Error('Only instances of Project class can be added to the manager');
    if (this.getProject(project.name))
      throw new Error('A project with the same name already exists');
    this.projects.push(project);
  }

  getProject (name) {
    if (!name)
      throw new Error('Missing mandatory argument name');
    return this.projects.find(p => p.name === name);
  }

  removeProject (name) {
    if (!name)
      throw new Error('Missing mandatory argument name');
    this.projects = this.projects.filter(p => p.name !== name);
  }

  removeAll () {
    this.projects = [];
  }

  write () {
    return new Promise((resolve, reject) => {
      fs.writeJson(this.file, this.projects)
        .then(resolve)
        .catch(reject);
    });
  }

  delete () {
    return new Promise((resolve, reject) => {
      fs.remove(this.file)
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports = ProjectManager;
