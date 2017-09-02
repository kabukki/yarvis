'use strict';

const electron = require('electron');
const Store = require('electron-store');
const fs = require('fs-extra');
const path = require('path');
const child_process = require('child_process');
const ProjectManager = require('../ProjectManager.js');
const _ = require('lodash');

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
.controller('projectsDetailCtrl', ($state, $stateParams, $scope, apiPromise, ModalService) => {
	$scope.config = new Store({ name: 'config' }).store;
	$scope.project = new ProjectManager($stateParams.project);
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

	$scope.getHiddenPassword = (password) => password && _.repeat('*', password.length) || 'None';

	/* Actions */
	$scope.gitInit = () => {
		$scope.project.git.repo = 'use';
		require('simple-git')($scope.project.directory).init();
		$scope.project.save();
	}
	$scope.openDirectory = (path) => {
		electron.shell.openItem(path)
	}

	$scope.actionMove = () => {
		let path = electron.remote.dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
			defaultPath: $scope.project.directory,
			properties: ['openDirectory', 'createDirectory']
		});
		delete $scope.error;
		if (path) {
			$scope.loading = true;
			console.log(path)
			apiPromise.projectManagerAPI($scope.project, 'move', path[0])
				.catch((err) => {
					$scope.error = err;
				})
				.finally(() => {
					$scope.loading = false;
				})
		}
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

	$scope.confirmAction = (action, redirect) => {
		ModalService.showModal({
			icon: 'trash',
			title: 'Confirm action',
			text: 'Are you sure ? This cannot be undone.',
			positive: 'Proceed',
			negative: 'Cancel',
			basic: true
		}).then((res) => {
			if (!res.status) return;
			$scope.action(action, redirect);
		})
	}

	$scope.authAction = (action, redirect) => {
		let inputs = {
			username: $scope.project.git.username,
			password: $scope.project.git.password
		};

		ModalService.showModal({
			icon: 'user',
			title: 'Authentication',
			text: 'Please provide credentials to authenticate into the ' + $scope.project.git.api + ' API.',
			htmlInclude: 'templates/authModal.html',
			positive: 'Proceed',
			negative: 'Cancel',
			basic: false,
			inputs: inputs
		}).then((res) => {
			if (!res.status) return;
			$scope.project.git.username = res.inputs.username;
			$scope.project.git.password = res.inputs.password;
			$scope.project.save();
			$scope.action(action, redirect);
		})
	}

	/* Modals to edit project */
	$scope.editModal = (prop, password) => {
		ModalService.showModal({
			icon: 'user',
			title: 'Edit',
			text: 'Edit the value of "' + prop + '"',
			htmlInclude: 'templates/editModal.html',
			positive: 'Proceed',
			cancelable: false,
			basic: false,
			inputs: {
				value: _.get($scope, prop),
				password: password
			}
		}).then((res) => {
			_.set($scope, prop, res.inputs.value)
			$scope.project.save();
		})
	}

	$scope.selectModal = (prop, choices) => {
		ModalService.showModal({
			icon: 'user',
			title: 'Select',
			text: 'Select the value of "' + prop + '" among the following',
			htmlInclude: 'templates/selectModal.html',
			positive: 'Proceed',
			cancelable: false,
			basic: false,
			inputs: {
				value: _.get($scope, prop),
				choices: choices
			}
		}).then((res) => {
			_.set($scope, prop, res.inputs.value)
			$scope.project.save();
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
			repo: 'none'
		},
		active: true
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
})
