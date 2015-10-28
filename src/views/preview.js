define([
    "hr/hr",
    "hr/utils",
    "hr/promise",
    "hr/dom",
    "utils/normalize",
    "core/server",
    "text!resources/templates/preview.html"
], function(hr, _, Q, $, normalize, server, templateFile) {
    var path = node.require("path");
    var url = node.require("url");
    var parse = node.require("gitbook").parse;

    // Configure mathjax
    MathJax.Hub.Config({
        messageStyle: "none",
        skipStartupTypeset: true,
        tex2jax: {
            processEscapes: true
        },
        showMathMenu:false,
        menuSettings: {
            zoom: "none",
            mpContext: true,
            mpMouse: true
        },
        errorSettings: { message: ["[Math Processing Error]"] }
    });

    var Preview = hr.View.extend({
        className: "book-section preview",
        template: templateFile,
        events: {
            "click .content a": "onClickLink",
            "click .server-start": "startServer",
            "click .server-stop": "stopServer",
            "click .toggle-autoscroll": "toggleScroll"
        },

        initialize: function() {
            Preview.__super__.initialize.apply(this, arguments);

            this.book = this.parent;
            this.sections = [];
            this.autoScroll = true;

            this.listenTo(this.book, "article:open", this.onArticleChange);
            this.listenTo(this.book, "article:write", _.debounce(this.onArticleChange, 150));

            this.listenTo(this, "render", _.bind(function() {
                if (!this.autoScroll) {
                    return;
                }

                var editor = this.parent.editor;
                this.scrollTop(editor.scrollTop() / editor.$(".content").height() * 100);
            }, this));
            this.listenTo(server, "state", this.onServerUpdate);
        },

        templateContext: function() {
            return {
                autoScroll: this.autoScroll,
                sections: this.sections,
                sanitizeHtml: normalize.html
            };
        },

        finish: function() {
            var currentFile = "index.html";
            if (this.book.currentArticle) currentFile = this.book.currentArticle.get("path");
            var current = "file://"+path.resolve(this.book.model.root(), currentFile);

            // Fix image url
            this.$(".content img").each(function() {
                $(this).attr("src", url.resolve(current, $(this).attr("src")));
            });

            // Render math expression
            MathJax.Hub.Typeset(this.el);

            // Tooltip
            this.$('.toolbar button').tooltip({
                container: 'body'
            });

            return Preview.__super__.finish.apply(this, arguments);
        },

        parseArticle: function(article, content) {
            var that = this;
            var _input = article.get("path");

            return Q()
            .then(function() {
                // Lex page
                return parse.lex(content);
            })
            .then(function(lexed) {
                // Get HTML generated sections
                return parse.page(lexed, {
                    repo: "",
                    dir: path.dirname(_input) || '/',
                    outdir: path.dirname(_input) || '/',
                });
            })
            .then(function(sections) {
                that.sections = sections;
                that.update();
            });
        },

        // When clicking on a link in the content
        onClickLink: function(e) {
            e.preventDefault();

            var href = $(e.currentTarget).attr("href");
            if (/^https?:\/\//i.test(href)){
                node.gui.Shell.openExternal(href);
            }
        },

        // When article is update (write or open)
        onArticleChange: function(article) {
            var that = this;

            this.book.readArticle(article)
            .then(_.partial(this.parseArticle, article).bind(this));
        },

        // When server state change
        onServerUpdate: function(state) {
            this.$(".server-start").tooltip('hide').attr("title", state? "Open Current Page" : "Start Preview Server").tooltip('fixTitle');
            this.$(".server-start").toggleClass("btn-success", state);
            this.$(".server-stop").toggle(state);
        },

        startServer: function(e) {
            if (e) e.preventDefault();

            if (server.isRunning()) {
                server.open(this.book.currentArticle);
            } else {
                this.book.refreshPreviewServer();
            }
        },
        stopServer: function(e) {
            if (e) e.preventDefault();

            server.stop();
        },

        // Scroll in percent
        scrollTop: function(x) {
            var th = this.$(".content").height();

            this.$(".content").scrollTop((x*th)/100);
        },

        toggleScroll: function() {
            this.autoScroll = !this.autoScroll;
            this.$(".toggle-autoscroll").toggleClass("btn-success", this.autoScroll);
        }
    });

    return Preview;
});