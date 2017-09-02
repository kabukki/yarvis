'use strict';

const Store = require('electron-store');
const remote = require('electron').remote;

angular.module('yarvis').controller('preferencesCtrl', ($scope, $q) => {
	const config = new Store({
		name: 'config'
	});
	const data = new Store({
		name: 'data'
	});
	$scope.config = config.store;
	$scope.configPath = config.path;
	$scope.dataPath = data.path;
	$scope.colors = [
		{ name: 'Red', value: 'red' },
		{ name: 'Orange', value: 'orange' },
		{ name: 'Yellow', value: 'yellow' },
		{ name: 'Olive', value: 'olive' },
		{ name: 'Green', value: 'green' },
		{ name: 'Teal', value: 'teal' },
		{ name: 'Blue', value: 'blue' },
		{ name: 'Violet', value: 'violet' },
		{ name: 'Purple', value: 'purple' },
		{ name: 'Pink', value: 'pink' },
		{ name: 'Brown', value: 'brown' },
		{ name: 'Grey', value: 'grey' }
	];

	// TODO: bind dialog to mainWindow
	$scope.selectPath = (prop, directory) => {
		let path = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			//defaultPath: $scope.config[prop],
			properties: [directory ? 'openDirectory' : 'openFile', 'createDirectory']
		});
		if (path) {
			path = path[0];
			console.log(path)
			// TODO: replace this messy code
			switch (prop) {
				case 'projects.directory': $scope.config.projects.directory = path; break ;
				case 'projects.boilerplates': $scope.config.projects.boilerplates = path; break ;
				case 'archives.directory': $scope.config.archives.directory = path; break ;
				case 'git.apis.github.privateKey': $scope.config.git.apis.github.privateKey = path; break ;
				case 'git.apis.blih.privateKey': $scope.config.git.apis.blih.privateKey = path; break ;
			}		
		}
	}

	$scope.selectColor = (language, color) => {
		console.log(`Selected ${color} for ${language}`)
		$scope.config.languages[language].color = color;
	}
	
	$scope.savePreferences = () => {
		console.log($scope.config)
		config.set($scope.config);
		//alert('Preferences saved.');
	}

});

