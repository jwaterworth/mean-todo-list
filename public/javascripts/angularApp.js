var app = angular.module('flapperNews', ['ui.router']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    ($stateProvider, $urlRouterProvider) => {
        $stateProvider.state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
            resolve: {
                postPromise: ['posts', function (posts) {
                    return posts.getAll();
                }]
            }
        });

        $stateProvider.state('posts', {
            url: '/posts/{id}',
            templateUrl: '/posts.html',
            controller: 'PostCtrl',
            resolve: {
                post: ['$stateParams', 'posts', function ($stateParams, posts) {
                    return posts.get($stateParams.id);
                }]
            }
        });

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: '/login.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function ($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        });

        $stateProvider.state('register', {
            url: '/register',
            templateUrl: '/register.html',
            controller: 'AuthCtrl',
            onEnter: ['$state', 'auth', function ($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
        });

        $urlRouterProvider.otherwise('home');
    }
]);

app.factory('posts', ['$http', 'auth', ($http, auth) => {
    let o = {
        posts: []
    };

    o.get = function (id) {
        return $http.get('/posts/' + id).then(function (res) {
            return res.data;
        });
    }

    o.getAll = function () {
        return $http.get('/posts').success(function (data) {
            angular.copy(data, o.posts);
        });
    }

    o.create = function (post) {
        return $http.post('/posts', post, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            o.posts.push(data);
        });
    }

    o.upvote = function (post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        })
            .success(function () {
                post.upvotes += 1;
            });
    }

    o.addComment = function (id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        });
    }

    o.upvoteComment = function (post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        })
            .success(function (data) {
                comment.upvotes += 1;
            });
    }

    return o;
}]);

app.factory('auth', ['$http', '$window', function ($http, $window) {
    const tokenKey = 'flapper-news-token';

    var auth = {};

    var getPayload = function (token) {
        return JSON.parse($window.atob(token.split('.')[1]));
    }

    auth.saveToken = function (token) {
        $window.localStorage[tokenKey] = token;
    }

    auth.getToken = function () {
        return $window.localStorage[tokenKey];
    }

    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if (token) {
            return getPayload(token).exp > Date.now() / 1000;
        }
    }

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();

            return getPayload(token).username;
        }
    }

    auth.register = function (user) {
        return $http.post('/register', user).success(function (data) {
            auth.saveToken(data.token);
        });
    }

    auth.login = function (user) {
        return $http.post('/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    }

    auth.logout = function () {
        $window.localStorage.removeItem(tokenKey);
    }

    return auth;
}]);

app.controller('MainCtrl', [
    '$scope', 'posts', 'auth',
    function ($scope, posts, auth) {
        $scope.test = 'Hello World';
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.addPost = () => {
            if (!$scope.title || $scope.title === '') {
                return;
            }

            posts.create({
                title: $scope.title,
                link: $scope.link
            });

            $scope.title = '';
            $scope.link = '';
        };

        $scope.incrementUpvotes = (post) => {
            posts.upvote(post);
        }
    }
]);

app.controller('PostCtrl', [
    '$scope',
    'posts',
    'post',
    'auth',
    ($scope, posts, post, auth) => {
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.addComment = () => {
            if ($scope.body === '') {
                return;
            }

            posts.addComment(post._id, {
                body: $scope.body,
                author: auth.currentUser()
            }).success(function (comment) {
                $scope.post.comments.push(comment);
            });

            $scope.body = '';
        }

        $scope.incrementUpvotes = function (comment) {
            posts.upvoteComment(post, comment);
        }
    }
]);

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {
        $scope.user = {};

        $scope.register = function () {
            auth.register($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        }

        $scope.logIn = function () {
            auth.login($scope.user)
                .error(function (error) {
                    $scope.error = error;
                }).then(function () {
                    $state.go('home');
                });
        }
    }
]);

app.controller('NavCtrl', [
    '$scope',
    'auth',
    function ($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logout;
    }]
);