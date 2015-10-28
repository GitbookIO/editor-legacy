define([
    "hr/utils"
], function(_) {
    var sanitizeHtml = node.require('sanitize-html');

    // Remove extra whitespace on the right of lines
    var whitespace = function(str, options) {
        options = _.defaults(options || {}, {
            cursor: null
        });

        return str.split('\n')
        .map(function(line, i) {
            if (options.cursor
            && options.cursor.row == i
            && options.cursor.column == line.length) {
                return line;
            }
            return line.trimRight();
        })
        .join('\n');
    };

    // Ensure file is correctly termined by a newline
    var eof = function(str, options) {
        options = _.defaults(options || {}, {
            cursor: null
        });

        return str[str.length-1] === '\n' ? str : str + '\n';
    };

    // Convert data uri to buffer
    var dataTobuffer = function(data) {
        var matches = data.match(/^data:.+\/(.+);base64,(.*)$/);
        return new Buffer(matches[2], 'base64');
    };

    // Sanitize an html string
    var html = function(dirty) {
        return sanitizeHtml(dirty, {
            allowedTags: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a',
                'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em',
                'strike', 'code', 'hr', 'br', 'div', 'table', 'thead',
                'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'script'
            ],
            allowedAttributes: {
                a: [ 'href', 'name', 'target' ],
                img: [ 'src' ],
                script: [ 'type' ]
            },
            selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
            allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
            exclusiveFilter: function(frame) {
                if (frame.tag !== 'script') return false;

                var type = frame.attribs.type || "";
                return (type.indexOf("math/tex") < 0);
            }
        });
    };

    return {
        eof: eof,
        whitespace: whitespace,
        dataTobuffer: dataTobuffer,
        html: html
    };
});
