
var async = require('async');
var utils = require('lodash');
var Promise = require('promise');

function filterByAuthor(author) {
    return function(pr) {
        return !author || author === pr.author.user.name;
    };
}

function filterByFork(fork) {
    return function(pr) {
        var from = pr.fromRef.repository.project.key + '/' + pr.fromRef.repository.slug
        var to = pr.toRef.repository.project.key + '/' + pr.toRef.repository.slug
        return (fork) ? from !== to : from === to;
    }
}

module.exports = function (client) {
    var repos = require('./repos')(client);
    return {

      getCombined: function(projectKey, repo, options) {
          if (projectKey && repo) {
              return this.get(projectKey, repo, options);
          }
          else {
              var prsCombined = [ ];
              var API = this;

              // Find all repos matching projectKey/repo & return all PRs for each.
              return new Promise(function(resolve, reject) {
                  // Find all repos.
                  repos.getCombined(projectKey).then(function(reposResponse) {
                      // Async loop.
                      async.forEachOf(reposResponse.values, function(repo, index, callback) {
                          API.get(repo.project.key, repo.slug, options).then(function(prResponse) {
                              prsCombined = utils(prsCombined).concat(prResponse.values).value();
                              callback();
                          }).catch(function(err) {
                              callback(err);
                          });

                      }, function(err) { // all PRs resolved.
                          if (err) {
                              reject(err);
                          }
                          else {
                              resolve({values:prsCombined});
                          }
                      });
                  }).catch(function(err) {
                      reject(err);
                  });
              });
          }
      },

      getAll: function(projectKey, repo, options) {
          if (!options) {
              options = {};
          }

          clientOptions = { args: { 'state': options.state || 'OPEN' } };
          var path = 'projects/' + projectKey + '/repos/' + repo + '/pull-requests';

          return client.getCollection(path, clientOptions).then(function(response) {
              // filter by author.
              if (options.author) {
                  response.values = response.values.filter(filterByAuthor(options.author));
              };
              if (!utils.isUndefined(options.fork)) {
                  response.values = response.values.filter(filterByFork(options.fork));
              }
              return response;
          });
      },

      create: function(projectKey, repoSlug, data) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests', data);
      },

      get: function(projectKey, repoSlug, options) {
        options = options || {};
        options.args = utils.defaults(options.args || {}, { 'limit': 1000 });
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests', options);
      },

      update: function(projectKey, repoSlug, pullRequestId, data) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId, data);
      },

      //merge
      mergeTest: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/merge', options);
      },

      merge: function(projectKey, repoSlug, pullRequestId, version) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/merge?version=' + version);
      },

      activities: function(projectKey, repoSlug, pullRequestId, options) {
        options = options || {};
        options.args = utils.defaults(options.args || {}, { 'limit': 1000 });
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/activities', options);
      },

      decline: function(projectKey, repoSlug, pullRequestId, version) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/decline?version=' + version);
      },

      reopen: function(projectKey, repoSlug, pullRequestId, version) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/reopen?version=' + version);
      },

      unapprove: function(projectKey, repoSlug, pullRequestId, version) {
        return client.delete('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/activities?version=' + version);
      },

      approve: function(projectKey, repoSlug, pullRequestId, version) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/activities?version=' + version);
      },

      approve: function(projectKey, repoSlug, pullRequestId, options) {
        options = options || {};
        options.args = utils.defaults(options.args || {}, { 'limit': 1000 });
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/changes', options);
      },

      commentsAdd: function(projectKey, repoSlug, pullRequestId, data) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/comments', data);
      },

      comments: function(projectKey, repoSlug, pullRequestId, commentId, path, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/comments?path=' + path, options);
      },

      commentsUpdate: function(projectKey, repoSlug, pullRequestId, commentId, data) {
        return client.put('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/comments/' + commentId, data);
      },

      commentsDelete: function(projectKey, repoSlug, pullRequestId, commentId, version) {
        return client.delete('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/comments/' + commentId+ '?version=' + version);
      },

      commits: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/commits', options);
      },

      diff: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/diff', options);
      },

      participantsAdd: function(projectKey, repoSlug, pullRequestId, data) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/participants', data);
      },

      participantsDelete: function(projectKey, repoSlug, pullRequestId, username, version) {
        return client.delete('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/participants?username=' + username);
      },

      participants: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/participants', options);
      },

      tasks: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/tasks', options);
      },

      tasksCount: function(projectKey, repoSlug, pullRequestId, options) {
        return client.get('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/tasks/count', options);
      },

      watch: function(projectKey, repoSlug, pullRequestId, options) {
        return client.post('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/watch');
      },

      unwatch: function(projectKey, repoSlug, pullRequestId, data) {
        return client.delete('projects/' + projectKey + '/repos/' + repoSlug + '/pull-requests/' + pullRequestId + '/watch');
      }

    }
};
