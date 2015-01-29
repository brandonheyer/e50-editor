var app = angular.module('app', ['E50Editor', 'ngSanitize', 'textAngular']);
app.controller('MainCtrl', function($scope, $http, $interval) {

  $scope.iframeId = "iframe1";
  $scope.buttons = {};

  // Fetch template
  $http.get('templates/template.tpl.html').success(function(tpl) {
    $scope.tplHtml = tpl;
  });

  // Bacon ipsum text
  $http.get('http://baconipsum.com/api/?type=meat-and-filler&paras=4').success(function(res) {
    res.forEach(function(p, i) {
      $scope.contentHtml += '<p>'+p+'</p>';
      if(i === 0 || i === 2) {
        $scope.contentHtml += '<p><img class="placeholder" src="placeholder.png" alt="" /><br></p>';
      }
    });
  });

  $scope.logHtml = function() {
    console.log($scope.tplHtml);
  };

  $scope.$on('e50Document', function($event, name) {
    if(name === $scope.iframeId) {
      $scope.iframeLoaded = true;
    }
  });

  //var promise = $interval(function() {
  //  $http.get('http://localhost:3000/demo/template.css').success(function(res) {
  //    console.log(res);
  //  });
  //}, 1000);
});