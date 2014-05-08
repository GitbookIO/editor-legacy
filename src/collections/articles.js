define([
    "hr/hr",
    "hr/utils",
    "models/article"
], function(hr, _, Article) {
    var parseSummary = node.require("gitbook").parse.summary;

    var Articles = hr.Collection.extend({
        model: Article,

        /*
         *  Parse SUMMARY.md content to extract articles tree
         */
        parseSummary: function(content) {
            var summary = parseSummary(content);

            try {
                this.reset(summary.chapters);
            } catch (e) {
                console.error(e.stack);
            }

        },

        /*
         *  Return a markdown representation of the summary
         */
        toMarkdown: function() {
            var bl = "\n";
            var content = "# Summary"+bl+bl;

            var _base = function(_article) {
                var article = _article.toJSON();
                if (article.path) {
                    var unixFriendlyPath = article.path.replace(/\\/g, '/');
                    return "* ["+article.title+"]("+unixFriendlyPath+")";
                } else {
                    return "* "+article.title;
                }
            }

            this.each(function(chapter) {
                content = content + _base(chapter)+bl;

                // Articles
                if (chapter.articles.size() > 0) {

                    chapter.articles.each(function(article) {
                        content = content+"    "+_base(article)+bl;
                    });
                }
            });

            content = content+bl;

            return content;
        }
    });

    return Articles;
});