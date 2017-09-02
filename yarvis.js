'use strict';

/*
 * Angular App
 */

angular.module('yarvis', [
	// Dependencies
	'ui.router',
	'semantic.modals'
])
.config(($stateProvider) => {
	$stateProvider
	/* Home (TODO) */
	.state('home', {
		url: '/',
		templateUrl: 'views/statistics.html'
	})

	/* Projects */
	.state('projects', {
		templateUrl: 'views/projects.html'
	})
	.state('projects.all', {
		templateUrl: 'views/projects-all.html'
	})
	.state('projects.detail', {
		params: { project: null },
		templateUrl: 'views/projects-detail.html',
	})
	.state('projects.new', {
		params: { p: null },
		templateUrl: 'views/projects-new.html',
	})
	.state('projects.new.project', {
		templateUrl: 'views/projects-new-project.html',
	})
	.state('projects.new.git', {
		templateUrl: 'views/projects-new-git.html',
	})
	.state('projects.new.boilerplate', {
		templateUrl: 'views/projects-new-boilerplate.html',
	})

	/* Libraries */
	.state('libraries', {
		url: '/libraries',
		templateUrl: 'views/libraries.html'
	})

	/* Statistics */
	.state('statistics', {
		url: '/statistics',
		templateUrl: 'views/statistics.html'
	})

	/* Preferences */
	.state('preferences', {
		url: '/preferences',
		templateUrl: 'views/preferences.html'
	})
})

/*
 * Directives
 */

.directive('treeView', ($parse) => ({
	restrict: 'AE',
	scope: {
		root: '=',
		depth: '=?'
	},
	templateUrl: 'templates/treeView.html',
	compile: (element, attrs) => {
		if (!attrs.depth) {
			attrs.depth = 3;
		}
	}
}))

/*
 * Services
 */

.service('apiPromise', ['$q', function ($q) {
	this.projectManagerAPI = (project, api, arg) => {
		let defer = $q.defer();
		project[api]((err) => {
			if (err)
				defer.reject(err);
			defer.resolve();
		}, arg)
		return defer.promise;
	}
}])