'use strict';

const electron = require('electron');
const Store = require('electron-store');
const fs = require('fs-extra');
const path = require('path');
const child_process = require('child_process');
const ProjectManager = require('../ProjectManager.js');

angular.module('yarvis')

/*
 * Controllers
 */

/* Projects - All */
.controller('projectsAllCtrl', ['$scope', ($scope) => {
	$scope.config = new Store({ name: 'config' }).store;
	$scope.data = new Store({ name: 'data' }).store;

	$scope.getMetaString = (project) => {
		if (project.deadline) {
			return (moment(project.deadline).isAfter() ? 'Due ' : 'Ended ') +
					moment(project.deadline).fromNow();
		} else {
			return 'Started ' + moment(project.start).fromNow();
		}
	}

	/* Sync projects data */
	$scope.synchronize = () => {
		console.log('syncing projects data')
	}
}])
/* Projects - Detail */
.controller('projectsDetailCtrl', ($state, $stateParams, $scope, apiPromise) => {
	$scope.config = new Store({ name: 'config' }).store;

	$scope.project = new ProjectManager($stateParams.p);
	$scope.files = dirTree($scope.project.directory);
	if ($scope.files === null) {
		$scope.filesError = new Error('Could not read directory');
	}
	$scope.loading = false;

	/* General info */
	$scope.getStartString = (project) => 'Started on ' +
											moment(project.start).format('LLL') +
											' (' + moment(project.start).fromNow() + ')';

	$scope.getDeadlineString = (project) => (moment(project.deadline).isAfter() ? 'Due for ' : 'Ended on ') +
											moment(project.deadline).format('LLL') +
											' (' + moment(project.deadline).fromNow() + ')';

	/* Actions */
	$scope.openDirectory = (path) => {
		electron.shell.openItem(path)
	}

	$scope.action = (action, redirect) => {
		delete $scope.error;
		$scope.loading = true;
		apiPromise.projectManagerAPI($scope.project, action)
		.then(() => {
			if (redirect)
				$state.go('projects.all');
		})
		.catch((err) => {
			$scope.error = err;
		})
		.finally(() => {
			$scope.loading = false;
		})
	}
})

/* Projects - New */
.controller('projectsNewCtrl', ($state, $stateParams, $scope, apiPromise) => {
	$scope.config = new Store({ name: 'config' }).store;
	// Default values for project
	$scope.project = {
		remote: $scope.config.git.remote,
		directory: $scope.config.projects.directory,
		start: new moment().format(),
		git: {
			enabled: false,
			username: $scope.config.git.username,
			password: $scope.config.git.password
		}
	};
	$scope.boilerplates = fs.readdirSync($scope.config.projects.boilerplates)
							.map(dir => ({
								name: dir,
								files: dirTree(path.join($scope.config.projects.boilerplates, dir))
							}));
	$scope.loading = false;

	/* On change */
	$scope.updateDirectory = () => {
		$scope.project.directory = path.join($scope.config.projects.directory, $scope.project.name)
	}
	$scope.updateCredentials = () => {
		$scope.project.git.username = $scope.config.git.apis[$scope.project.git.api].username;
		$scope.project.git.password = $scope.config.git.apis[$scope.project.git.api].password;
	}

	$scope.createProject = () => {
		delete $scope.error;
		$scope.loading = true;
		try {
			let p = new ProjectManager($scope.project);
			p.check();
			apiPromise.projectManagerAPI(p, 'create')
			.then(() => {
				$state.go('projects.all');
			})
			.catch((err) => {
				$scope.error = err;
			})
			.finally(() => {
				$scope.loading = false;
			})
		} catch (e) {
			$scope.error = e;
			$scope.loading = false;
		}
	}

	$scope.caca = () => { console.log('caca') }
})
