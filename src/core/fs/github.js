define([
    "hr/hr",
    "hr/promise",
    "hr/utils",
    "octokit"
], function(hr, Q, _, Octokit) {
    var fs = node.require("fs");
    var path = node.require("path");

    var GitHubFs = hr.Class.extend({
        initialize: function(options) {
            var gh = new Octokit({
                usePostInsteadOfPatch: true,
                username: options.username,
                password: options.password,
                token: options.token
            });

            // Parse the URL. Example: "https://api.github.com/GitbookIO/javascript#master"
            var base = options.path;
            var repoAndBranch = base.split('#');
            var repoUser = repoAndBranch[0].split('/')[0];
            var repoName = repoAndBranch[0].split('/')[1];
            var branchName = repoAndBranch[1];
            this.branch = gh.getRepo(repoUser, repoName).getBranch(branchName || null);
        },
        isValidPath: function(_path) {
            return true;
        },
        virtualPath: function(_path) {
            return _path;
        },

        /*
         * Read a file by its path
         *
         * @return Promise(String)
         */
        read: function(_path) {
            return this.branch.read(_path)
            .then(function(obj) {
                // Octokit returns a `{sha:, content:}` pair
                return obj.content;
            });
        },

        /*
         * Write a file by its path
         *
         * @return Promise()
         */
        write: function(_path, content) {
            return this.branch.write(_path, content);
        },

        /*
         * Check a file exists
         *
         * @return boolean
         */
        exists: function(_path) {
            var deferred = Q.defer();
            this.read(_path)
            .then(
                function() { deferred.resolve(true); },
                function() { deferred.resolve(false); }
            );
            return deferred.promise;
        },

        /*
         * Commit all changes
         *
         * @return Promise()
         */
        commit: function(message) {
            return Q();
        }
    });

    return GitHubFs;
});
