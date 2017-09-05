'use strict';

const GitHub = require('github');
const Blih = require('blih-api');

const supportedApis = ['github', 'blih'];

class GitApi {

  /***************/
  /* Constructor */
  /***************/

  constructor (type) {
    if (!type)
      throw new Error('Missing mandatory argument type');
    if (supportedApis.indexOf(type) < 0)
      throw new Error('This API is not supported');
    this.type = type;
  }

  /*******************/
  /* Regular methods */
  /*******************/

  authenticate (username, password) {
    switch (this.type) {
      case 'github':
        this.api = new GitHub();
        this.api.authenticate({
          type: 'basic',
          username: username,
          password: password
        });
        break;

      case 'blih':
        this.api = new Blih(username, password);
        break;
    }
    return this;
  }

  create (name, options) {
    return new Promise((resolve, reject) => {
      options = options || {};

      if (!this.api) {
        reject(new Error('You must first authenticate into the API.'));
      } else {
        switch (this.type) {
          case 'github':
            this.api.create({
              name: name,
              description: options.description,
            })
            .then((res) => {
              resolve(res.data.clone_url);
            }).catch(reject);
            break;

          case 'blih':
            this.api.createRepository(name, (err) => {
              if (err) {
                reject(err);
              } else if (options.legacyUsername && typeof options.legacyUsername === 'string') {
                resolve('git@git.epitech.eu:/' + options.legacyUsername + '/' + name);
              } else {
                resolve();
              }
            });
            break;
        }
      }
    });
  }

  // delete

}

module.exports = GitApi;
