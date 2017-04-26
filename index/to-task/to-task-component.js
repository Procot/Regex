angular.module('toTask', []);

angular.
	module('toTask').
	component('toTask', {
		templateUrl: 'index/to-task/to-task-template.html',
		controller: ['$rootScope', '$http', '$routeParams', 
		function toTaskController($rootScope, $http, $routeParams) {
			this.taskId = $routeParams.taskId;
			const self = this;
			$http.get(`index/tasks/${this.taskId}.json`).then((res) => {
				self.task = res.data;

				$rootScope.title = self.task.title;
				classRegex.currentTask = {
					'titleRussian': self.task.title,
					'titleEnglish': this.taskId
				};
			});
			this.submit = function() {
				const data = {};
				data.code = document.querySelector('#code').value;
				data.task = self.taskId;
				classRegex.Submit(data);
				//classRegex.submitData = data;
				//document.location.href = `#/task/results`;
			}

			$rootScope.showingMenu = true;
            if (!classRegex.isAutorizated) {
                $rootScope.isAutorizated = this.isAutorizated = false;                
            } else {
                $rootScope.isAutorizated = this.isAutorizated = true;                
                $rootScope.userName = classRegex.user.login;
            }
		}]
	});