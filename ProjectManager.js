'use strict';

const fs = require('fs-extra')
	, url = require('url')
	, Store = require('electron-store')
	, moment = require('moment')
	/* Git APIs */
	, Blih = require('blih-api')
	, GitHub = require('github')

const data = new Store({ name: 'data' });
const config = new Store({ name: 'config' }).store;

class ProjectManager {
	constructor (project) {
		Object.assign(this, project);
	}

	/* Check object integrity */
	check () {
		const minimalFields = [
			{name: 'name', message: 'No name specified'},
			{name: 'language', message: 'No language selected'},
			{name: 'directory', message: 'No directory specified'}
		];
     
     	/* Required fields */
     	for (const field of minimalFields) {
     		if (!this.hasOwnProperty(field.name)) {
				throw new Error(field.message);
     		}
     	}
		/* Check for name availability */
		if (this.isProject() || this.isArchive()) {
			throw new Error('This name is already taken by another project');
		}
		/* Check for directory availability */
		if (data.store.projects.find(p => p.directory == this.directory)) {
			throw new Error('This directory is already used by another project');
		}
		/* Check for dates consistency */
		if (this.deadline && moment(this.deadline).isBefore(this.start)) {
			throw new Error('The deadline cannot be after the start of the project.');
		}

		if (this.git.enabled) {
			if (this.git.api) {
				if (!this.git.username || !this.git.password) {
					throw new Error('Git is enabled but credentials are missing');
				}
			} else {
				throw new Error('Git is enabled but no API was specified');
			}
		}
	}

	/* TODO - review: if add remote fails, repo & dir are still here */
	create (callback) {
		if (this.git.enabled) {
			this.createRepository((err) => {
				if (!err) {
					this.createDirectory((err) => {
						if (!err) {
							require('simple-git')(this.directory)
								.init()
								.addRemote('origin', this.git.remote, (err) => {
									if (!err) {
										this.save();
									}
									callback(err);
								});
						} else {
							callback(err);
						}
					});
				} else {
					callback(err);
				}
			});
		} else {
			this.createDirectory((err) => {
				if (!err) {
					this.save();
				}
				callback(err);
			});
		}
	}

	createRepository (callback) {
		let api;
		switch (this.git.api) {
			case 'github':
				api = new GitHub();

				api.authenticate({
					type: config.git.apis.github.authentication,
					username: this.git.username,
					password: this.git.password
				});
				api.repos.create({
					name: this.name,
					description: this.description
				}).then((res) => {
					this.git.remote = res.data.clone_url;
					callback();
				}).catch((err) => {
					callback(err);
				})
				break ;
			case 'blih':
				api = new Blih(this.git.username, this.git.password)

				api.createRepository(this.name, (err, data) => {
					console.log(err, data)
					if (!err) {
						this.git.remote = 'git@git.epitech.eu:/' + config.git.apis.blih.legacyUsername + '/' + this.name;
						callback();
					} else {
						callback(new Error(err));
					}
				});
				break ;
			default:
				console.log('not creating any repo since API is unknown')
				break ;
		}
	}

	createDirectory (callback) {
		if (this.boilerplate) {
			fs.copy(this.boilerplate.files.path, this.directory, { overwrite: false }, (err) => {
				delete this.boilerplate;
				callback(err);
			})
		} else {
			fs.ensureDir(this.directory, (err) => {
				callback(err);
			});
		}
	}

	/***********/
	/* Actions */
	/***********/

	archive (callback) {
		let projects = data.store.projects.filter(p => p.name != this.name);
		let archives = data.store.archives.filter(p => p.name != this.name);

		data.set('projects', projects);
		archives.push(this);
		data.set('archives', archives);
		callback();
	}

	unarchive (callback) {
		let projects = data.store.projects.filter(p => p.name != this.name);
		let archives = data.store.archives.filter(p => p.name != this.name);

		data.set('archives', archives);
		projects.push(this);
		data.set('projects', projects);
		callback();
	}

	save () {
		let projects = data.get('projects');

		projects.push(this);
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
		switch (this.git.api) {
			case 'github':
				api = new GitHub();

				api.authenticate({
					type: config.git.apis.github.authentication,
					username: this.git.username,
					password: this.git.password
				});
				api.repos.delete({
					owner: this.git.username,
					repo: this.name
				}).then((res) => {
					this.deleteLocal(callback);
				}).catch((err) => {
					callback(err);
				})
				break ;
			case 'blih':
				api = new Blih(this.git.username, this.git.password);

				api.deleteRepository(this.name, (err) => {
					if (!err) {
						this.deleteLocal(callback);
					} else {
						callback(new Error(err));
					}
				});
				break ;
			default:
				callback(new Error('Cannot delete repository since this API is unknown'));
				break ;
		}
	}

	/***********/
	/* Getters */
	/***********/

	isArchive () {
		return data.store.archives.find(p => p.name === this.name) !== undefined;
	}
	isProject () {
		return data.store.projects.find(p => p.name === this.name) !== undefined;
	}
}

module.exports = ProjectManager;
