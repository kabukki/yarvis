'use strict';

const Store = require('electron-store');

angular.module('yarvis').controller('preferencesCtrl', ($scope) => {
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

