angular.module('fastBasket.products', [])
.controller('productsController', function($scope, $http, $rootScope, shopCart){

  if ($rootScope.shopCart === undefined || $rootScope.shopCart === null){
    $rootScope.shopCart = [];
    $rootScope.shopCartTotal = 0;

    shopCart.getCart($rootScope.user.id)
    .then(function(redisRes){
      if (redisRes !== null){
        $rootScope.shopCart = JSON.parse(redisRes);
        calculateTotal();
      }
    });
  }

  if ($rootScope.recommendations === undefined || $rootScope.recommendations === null || $rootScope.recommendations.length === 0){
    shopCart.getRecommendations($rootScope.user.id)
    .then(function(redisRes){
      if (redisRes !== null){
        $rootScope.recommendations = JSON.parse(redisRes);
      }
    });
  }

  function calculateTotal(){
    $rootScope.shopCartTotal = 0;
    for (var i=0; i<$rootScope.shopCart.length; i++){
      $rootScope.shopCartTotal += parseFloat($rootScope.shopCart[i].price);
    }
    $rootScope.shopCartTotal = $rootScope.shopCartTotal.toFixed(2);
  }

  $scope.addItem = function(item){
    $rootScope.shopCart.push(item);
    calculateTotal();
    shopCart.setCart($rootScope.user.id, $rootScope.shopCart)
    .then(function(){
    });
  };

  var selectedItemChange = function(text){
    if (text && text.trim() !== ''){
      $http({
        method: 'GET',
        url: '/api/product/showResults/' + text + '/' + $rootScope.user.id
      })
      .then(function(products){
        $rootScope.products = products.data;
      });
    }
  };

  $scope.searchRecommendation = function(recom){
    $rootScope.currSearch = recom;
    selectedItemChange(recom);
  };

});
