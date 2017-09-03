'use strict';

const Store = require('electron-store');

angular.module('yarvis')
.controller('statisticsCtrl',
  ($scope) => {
  	const data = new Store({
  		name: 'data'
  	});
  	$scope.data = data.store;

  	$scope.getNbProjects = () => $scope.data.projects.length;
  	$scope.getNbFiles = () => 0;
  	$scope.getNbRepos = () => $scope.data.projects.reduce((a, b) => a + (b.git.repo !== 'none'), 0);
  }
);
