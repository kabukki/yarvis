'use strict';

const Store = require('electron-store');

angular.module('yarvis').controller('statisticsCtrl', ['$scope', ($scope) => {
	const data = new Store({
		name: 'data'
	}), config = new Store({
		name: 'config'
	});
	$scope.data = data.store;

	/* Projects */
	$scope.getNbProjects = () => $scope.data.projects.length + $scope.data.archives.length;
	$scope.getNbFiles = () => 0;

	/* Teamork */
	$scope.getNbRepos = () => $scope.data.projects.concat($scope.data.archives).reduce((a, b) => a + b.git, 0);
}]);

