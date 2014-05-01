define([
    "hr/hr",
    "hr/promise",
    "utils/normalize",
    "utils/dialogs",
    "models/article",
    "core/server",
    "views/grid",
    "views/summary",
    "views/editor",
    "views/preview"
], function(hr, Q, normalize, dialogs, Article, server, Grid, Summary, Editor, Preview) {
    var generate = node.require("gitbook").generate;

    var Book = hr.View.extend({
        className: "book",
        defaults: {
            fs: null
        },

        initialize: function() {
            Book.__super__.initialize.apply(this, arguments);

            this.fs = this.options.fs;

            // Map article path -> content
            this.articles = {};
            this.currentArticle = null;

            this.grid = new Grid({
                columns: 3
            }, this);
            this.grid.appendTo(this);

            // Summary
            this.summary = new Summary({}, this);
            this.summary.update();
            this.grid.addView(this.summary, {width: 20});

            // Editor
            this.editor = new Editor({}, this);
            this.editor.update();
            this.grid.addView(this.editor);

            // Preview
            this.preview = new Preview({}, this);
            this.preview.update();
            this.grid.addView(this.preview);

            this.openReadme();
        },

        /*
         *  Build the book
         */
        buildBook: function(params, options) {
            var that = this;

            return generate.folder(_.extend(params || {}, {
                input: this.fs.options.base
            }));
        },

        /*
         *  Generate a file (pdf or ebook)
         */
        buildBookFile: function(format, params) {
            var that = this;

            var filename = format == "pdf" ? "book.pdf" : "book.epub";

            dialogs.saveAs(filename)
            .then(function(_path) {
                return generate.file(_.extend(params || {}, {
                    extension: "pdf",
                    input: that.fs.options.base,
                    output: _path,
                    generator: format
                }))
                .then(_.constant(_path));
            })
            .then(function(_path) {
                node.gui.Shell.showItemInFolder(_path);
            }, dialogs.error);
        },

        /*
         * Refresh preview
         */
        refreshPreviewServer: function() {
            var that = this;
            console.log("start server on ", this.fs.options.base);

            return server.stop()
            .then(function() {
                return that.buildBook();
            })
            .then(function(options) {
                return server.start(options.output)
            })
            .then(function() {
                server.open();
            }, function(err) {
                dialogs.alert("Error starting preview server:", err.message || err);
            });
        },

        /*
         * Show an article
         */
        openArticle: function(article) {
            var that = this;

            var doOpen = function() {
                that.currentArticle = article;
                that.trigger("article:open", article);
                that.triggerArticleState(article);

                that.toggleArticlesClass(article, "active");

                return Q();
            };

            if (!article.get("path") || !that.fs.exists(article.get("path"))) {
                var normall = node.require("normall");
                    title = normall.filename(article.get("title"));
                return dialogs.saveAs(title+".md", that.fs.options.base)
                .then(function(path) {
                    if (!that.fs.isValidPath(path)) return Q.reject(new Error("Invalid path for saving this article, need to be on the book repository."));
                    path = that.fs.virtualPath(path);
                    article.set("path", path);
                })
                // Write article
                .then(function() {
                    return that.writeArticle(article, "# "+article.get("title")+"\n")
                })
                // Save the article
                .then(function() {
                    return that.saveArticle(article);
                })
                // Save summary
                .then(function() {
                    return that.summary.save();
                })
                .then(function() {
                    return doOpen();
                })
                .fail(function(err) {
                    dialogs.alert("Error", err.message || err);
                });
            }

            return doOpen();
        },

        /*
         * Show introduction
         */
        openReadme: function() {
            return this.openArticle(new Article({}, {
                title: "Introduction",
                path: "README.md"
            }));
        },

        // Get unsaved article
        getUnsavedArticles: function() {
            return _.chain(this.articles)
            .map(function(article, _path) {
                article.path = _path;
                return article;
            })
            .filter(function(article) {
                return !article.saved;
            })
            .value();
        },

        // Save all unsaved
        saveAll: function() {
            _.each(this.getUnsavedArticles(), function(_article) {
                var article = this.summary.getArticle(_article.path);
                console.log(_article.path, article);
                if (article) this.saveArticle(article);
            }, this);
        },

        // Read/Write article in this fs
        readArticle: function(article) {
            var that = this;
            var path = article.get("path");

            if (this.articles[path]) return Q(this.articles[path].content);

            return this.fs.read(path)
            .then(function(content) {
                that.articles[path] = {
                    content: content,
                    saved: true
                };
                return content;
            });
        },
        writeArticle: function(article, content) {
            var path = article.get("path");

            this.articles[path] = this.articles[path] || {};
            this.articles[path].saved = false;
            this.articles[path].content = content;

            this.trigger("article:write", article);
            this.triggerArticleState(article);

            return Q();
        },
        saveArticle: function(article) {
            var that = this;
            var path = article.get("path");
            if (!this.articles[path]) return Q.reject(new Error("No content to save for this article"));

            // Normalize content before saving
            var content = normalize.eof(
            normalize.whitespace(
                this.articles[path].content
            ));

            return this.fs.write(article.get("path"), content)
            .then(function() {
                that.articles[path].saved = true;
                that.triggerArticleState(article);

                // Update code views
                that.trigger("article:save", article, content);

                if (server.isRunning()) {
                    dialogs.confirm("Restart Preview Server", "Do you want to restart the preview server to access your last changes?")
                    .then(function() {
                        that.refreshPreviewServer();
                    });
                }
            });
        },
        triggerArticleState: function(article) {
            var path = article.get("path");
            var st = this.articles[path]? this.articles[path].saved : true;

            this.trigger("article:state", article, st);
            this.toggleArticleClass(article, "modified", !st);
        },
        getArticleState: function(article) {
            article = article || this.currentArticle;
            var path = article.get("path");
            return this.articles[path];
        },
        toggleArticleClass: function(article, className, st) {
            this.$("*[data-article='"+article.get("path")+"']").toggleClass(className, st);
        },
        toggleArticlesClass: function(article, className) {
            this.$("*[data-article]").each(function() {
                $(this).toggleClass(className, $(this).data("article") == article.get("path"));
            });
        }
    }, {
        /*
         *  Valid that a fs is a gitbook
         */
        valid: function(fs) {
            if (fs.exists("README.md") && fs.exists("SUMMARY.md")) {
                return Q();
            } else {
                return Q.reject(new Error("Invalid GitBook: need README.md and SUMMARY.md"));
            }
        }
    });

    return Book;
});