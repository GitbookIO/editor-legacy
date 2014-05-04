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
            .catch(function() { deferred.resolve(false); })
            .then (function() { deferred.resolve(true); });
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


    var LocalFs = hr.Class.extend({
        isValidPath: function(_path) {
            return _path.indexOf(this.options.base) === 0;
        },
        virtualPath: function(_path) {
            return path.relative(this.options.base, _path);
        },
        realPath: function(_path) {
            return path.join(this.options.base, _path);
        },

        /*
         * Read a directory content by its path
         *
         * @return Promise([File])
         */
        readdir: function(_path) {
            var that = this;
            _path = this.realPath(_path);

            return Q.nfcall(fs.readdir, _path)
            .then(function(files) {
                return Q.all(
                    _.chain(files)
                    .filter(function() {
                        if (file == "." || file == "..") return false;
                        return true;
                    })
                    .map(function(file) {
                        var f_path = path.join(_path, file);

                        return Q.nfcall(fs.stat, f_path)
                        .then(function(_stat) {
                            return {
                                'path': that.virtualPath(f_path),
                                'name': file,
                                'type': _stat.isDirectory() ? File.TYPE.DIRECTORY : File.TYPE.FILE
                            };
                        });
                    })
                    .value()
                );
            });
        },

        /*
         * Read a file by its path
         *
         * @return Promise(String)
         */
        read: function(_path) {
            var that = this;
            _path = this.realPath(_path);

            return Q.nfcall(fs.readFile, _path)
            .then(function(buf) {
                return buf.toString();
            });
        },

        /*
         * Write a file by its path
         *
         * @return Promise()
         */
        write: function(_path, content) {
            var that = this;
            _path = this.realPath(_path);

            return Q.nfcall(fs.writeFile, _path, content);
        },

        /*
         * Check a file exists
         *
         * @return boolean
         */
        exists: function(_path) {
            var that = this;
            _path = this.realPath(_path);

            var deferred = Q.defer();
            fs.exists(_path, function(exists) {
                deferred.resolve(exists);
            });
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

    return function(options) {
        if (/^https?:/.test(options.base)) {
            return new GitHubFs(options);
        } else {
            return new LocalFs(options);
        }
    };
});
