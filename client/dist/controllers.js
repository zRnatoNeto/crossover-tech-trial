'use strict';

(function () {
  'use strict';

  angular.module('app.home').controller('HomeController', HomeController);

  HomeController.$inject = ['HomeService', '$mdToast', '$location', '$rootScope', '$document', "$scope", '$anchorScroll'];

  function HomeController(HomeService, $mdToast, $location, $rootScope, $document, $scope, $anchorScroll) {
    var vm = this;

    vm.logout = function () {
      vm.dataLoading = true;
      HomeService.logout({
        'userData': {
          'username': angular.copy($rootScope.userSession.username)
        }
      }).then(function sucessCallback(response) {
        if (response.data.success) {
          delete $rootScope.userSession;
          $mdToast.show($mdToast.simple().textContent('Bye'));
          $rootScope.socket.disconnect();
          $location.path('/login');
        } else {
          $mdToast.show($mdToast.simple().textContent(response.data.err));
          vm.dataLoading = false;
        }
      }, function errorCallback(response) {
        $mdToast.show($mdToast.simple().textContent('Status error: ' + response.status + ' - ' + response.statusText));
        vm.dataLoading = false;
      });
    };

    vm.sendMsg = function () {
      if (vm.message) {
        var msg = {
          from: $rootScope.userSession.username,
          message: vm.message
        };
        $rootScope.socket.emit('msg', msg);
        vm.messages.push(msg);
        vm.message = '';
        $scope.$digest();
      }
    };

    $rootScope.socket.on('welcome', function (_username) {
      $mdToast.show($mdToast.simple().textContent(_username + ' has connected to the home.'));
    });

    $rootScope.socket.on('left', function (_username) {
      $mdToast.show($mdToast.simple().textContent(_username + ' has disconnected from the home.'));
    });

    $rootScope.socket.on('msg', function (_message) {
      vm.messages.push(_message);
      $scope.$digest();
    });

    activate();

    function activate() {
      $mdToast.show($mdToast.simple().textContent('Welcome ' + userSession.username));
      vm.messages = [];
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.login').controller('LoginController', LoginController);

  LoginController.$inject = ['$rootScope', 'LoginService', '$mdToast', '$location', '$document', 'sha256', '$base64'];

  function LoginController($rootScope, LoginService, $mdToast, $location, $document, sha256, $base64) {
    var vm = this;

    vm.login = function () {
      vm.dataLoading = true;
      var userData = angular.copy(vm.userData);
      userData.password = sha256.convertToSHA256(userData.password);
      var userCredential = $base64.encode(userData.username + ':' + userData.password);
      LoginService.login(userCredential).then(function sucessCallback(response) {
        if (response.data.status === 'success') {
          vm.userSession = response.data.data;
          $rootScope.userSession = angular.copy(vm.userSession);
          $location.path('/home');
        } else {
          $mdToast.show($mdToast.simple().textContent(response.data.data.message));
          if (response.data.data.errorCode === 10006) {
            vm.userData.password = '';
            var input = $document[0].getElementById('passwordForm');
            input.focus();
          } else {
            vm.userData = {};
            var _input = $document[0].getElementById('usernameForm');
            _input.focus();
          }
          vm.dataLoading = false;
        }
      }, function errorCallback(response) {
        $mdToast.show($mdToast.simple().textContent('Status error: ' + response.status + ' - ' + response.statusText));
        vm.userData = {};
        var input = $document[0].getElementById('usernameForm');
        input.focus();
        vm.dataLoading = false;
      });
    };

    vm.register = function () {
      $location.path('/register');
    };

    activate();

    function activate() {
      vm.dataLoading = false;
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.register').controller('RegisterController', RegisterController);

  RegisterController.$inject = ['$rootScope', 'RegisterService', '$mdToast', '$location', '$document', 'sha256'];

  function RegisterController($rootScope, RegisterService, $mdToast, $location, $document, sha256) {
    var vm = this;

    vm.register = function () {
      vm.dataLoading = true;
      if (vm.userData.password === vm.userData.confirmPassword) {
        var userData = angular.copy(vm.userData);
        delete userData.confirmPassword;
        userData.password = sha256.convertToSHA256(userData.password);
        RegisterService.register({ userData: userData }).then(function sucessCallback(response) {
          if (response.data.status === 'success') {
            $mdToast.show($mdToast.simple().textContent('Account created successfully'));
            vm.userSession = response.data.data;
            $rootScope.userSession = angular.copy(vm.userSession);
            $location.path('/home');
          } else {
            $mdToast.show($mdToast.simple().textContent(response.data.data.message));
            vm.userData = {};
            var input = $document[0].getElementById('usernameForm');
            input.focus();
            vm.dataLoading = false;
          }
        }, function errorCallback(response) {
          $mdToast.show($mdToast.simple().textContent('Status error: ' + response.status + ' - ' + response.statusText));
          vm.userData = {};
          var input = $document[0].getElementById('usernameForm');
          input.focus();
          vm.dataLoading = false;
        });
      } else {
        $mdToast.show($mdToast.simple().textContent('The password confirmation doesn\'t match, please try again.'));
        vm.userData.password = '';
        vm.userData.confirmPassword = '';
        var input = $document[0].getElementById('passwordForm');
        input.focus();
        vm.dataLoading = false;
      }
    };

    activate();

    function activate() {
      vm.dataLoading = false;
    }
  }
})();