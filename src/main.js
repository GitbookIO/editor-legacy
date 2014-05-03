require([
    "hr/utils",
    "hr/dom",
    "hr/promise",
    "hr/hr",
    "hr/args",
    "utils/dialogs",
    "utils/analytic",
    "core/update",
    "core/fs",
    "views/book"
], function(_, $, Q, hr, args, dialogs, analytic, update, Fs, Book) {
    var path = node.require("path");
    var wrench = node.require("wrench");
    var gui = node.gui;
    var __dirname = node.require("../src/dirname");

    // Configure hr
    hr.configure(args);

    hr.Resources.addNamespace("templates", {
        loader: "text"
    });

    // Define base application
    var Application = hr.Application.extend({
        name: "GitBook Editor",
        metas: {},
        links: {},
        events: {},

        initialize: function() {
            Application.__super__.initialize.apply(this, arguments);

            var that = this;

            this.book = new Book({
                fs: new Fs({
                    base: this.getLatestBook()
                })
            });
            this.book.update();
            this.book.appendTo(this);

            var menu = new gui.Menu({ type: 'menubar' });

            var fileMenu = new node.gui.Menu();
            fileMenu.append(new gui.MenuItem({
                label: 'New Book',
                click: function () {
                    that.openNewBook();
                }
            }));
            fileMenu.append(new gui.MenuItem({
                label: 'Open Book',
                click: function () {
                    that.openFolderSelection();
                }
            }));
            fileMenu.append(new gui.MenuItem({
                label: 'Open Book on GitHub',
                click: function () {
                    that.openGitHubBook();
                }
            }));
            fileMenu.append(new gui.MenuItem({
                type: 'separator'
            }));
            fileMenu.append(new gui.MenuItem({
                label: 'Check for Updates...',
                click: function () {
                    that.checkUpdate(true);
                }
            }));
            fileMenu.append(new gui.MenuItem({
                label: 'Close',
                click: function () {
                    gui.Window.get().close();
                }
            }));

            var bookMenu = new node.gui.Menu();
            bookMenu.append(new gui.MenuItem({
                label: 'Save all',
                click: function () {
                    that.book.saveAll();
                }
            }));
            bookMenu.append(new gui.MenuItem({
                type: 'separator'
            }));
            bookMenu.append(new gui.MenuItem({
                label: 'Preview Website',
                click: function () {
                    that.book.refreshPreviewServer();
                }
            }));
            bookMenu.append(new gui.MenuItem({
                type: 'separator'
            }));
            bookMenu.append(new gui.MenuItem({
                label: 'Build Website As...',
                click: function () {
                    dialogs.folder()
                    .then(function(_path) {
                        if (confirm("Do you really want to erase "+_path+" content and build the book website in it?")) {
                            that.book.buildBook({
                                output: _path
                            })
                            .then(function(options) {
                                node.gui.Shell.showItemInFolder(path.join(_path, "index.html"));
                            });
                        }
                    });
                }
            }));
            bookMenu.append(new gui.MenuItem({
                label: 'Build PDF As...',
                click: function () {
                    that.book.buildBookFile("pdf");
                }
            }));
            bookMenu.append(new gui.MenuItem({
                label: 'Build eBook As...',
                click: function () {
                    that.book.buildBookFile("ebook");
                }
            }));

            var devMenu = new node.gui.Menu();
            devMenu.append(new gui.MenuItem({
                label: 'Open Tools',
                click: function () {
                    var win = gui.Window.get();
                    win.showDevTools();
                }
            }));

            var helpMenu = new node.gui.Menu();
            helpMenu.append(new gui.MenuItem({
                label: 'GitHub',
                click: function () {
                    gui.Shell.openExternal('https://github.com/GitbookIO/gitbook');
                }
            }));
            helpMenu.append(new gui.MenuItem({
                label: 'Send Feedback',
                click: function () {
                    gui.Shell.openExternal('https://github.com/GitbookIO/editor/issues');
                }
            }));


            // Get reference to App's menubar
            // if we set this later menu entries are out of order
            if(process.platform === 'darwin') {
                gui.Window.get().menu = menu;
            }

            menu.insert(new gui.MenuItem({
                label: 'File',
                submenu: fileMenu
            }), process.platform === 'darwin' ? 1 : 0);
            menu.append(new gui.MenuItem({
                label: 'Book',
                submenu: bookMenu
            }));
            menu.append(new gui.MenuItem({
                label: 'Develop',
                submenu: devMenu
            }));
            menu.append(new gui.MenuItem({
                label: 'Help',
                submenu: helpMenu
            }));

            // Set the window's menu
            if(process.platform !== 'darwin') {
                gui.Window.get().menu = menu;
            }

            // Save before quitting
            gui.Window.get().on("close", function() {
                if (that.book.getUnsavedArticles().length == 0 || confirm("There is unsaved changes, do you really want to quit without saving?")) {
                    this.close(true);
                }
            });

            this.checkUpdate(false);
        },

        render: function() {
            gui.Window.get().show();
            return this.ready();
        },

        setBook: function(book) {
            if (this.book) {
                this.book.remove();
            }
            this.book = book;
            this.book.update();
            this.book.appendTo(this);
        },

        getLatestBook: function() {
            return hr.Storage.get('latestBook') || path.join(__dirname, "../intro");
        },

        setLatestBook: function(_path) {
            hr.Storage.set('latestBook', _path);
        },

        // Open a book at a specific path
        openPath: function(_path) {
            analytic.track("open");

            var that = this;
            var _fs = new Fs({
                base: _path
            });

            Book.valid(_fs)
            .then(function() {
                // Change current book
                that.setBook(new Book({
                    fs: _fs
                }));

                // Use as latest book
                that.setLatestBook(_path);
            }, dialogs.error);
        },

        // Click to select a new local folder
        openFolderSelection: function() {
            var that = this;

            dialogs.folder()
            .then(function(_path) {
                that.openPath(_path);
            });
        },

        // Click to select a new local folder
        openGitHubBook: function() {
            var that = this;

            dialogs.prompt(
                'Enter a GitHub Repo',
                'This should be in the form of "[REPO_USER]/[REPO_NAME]#[OPTIONAL_BRANCH]"',
                'GitbookIO/javascript'
            )
            .then(function(_path) {
                that.openPath('https://api.github.com/' + _path);
            });
        },

        // Create a new book and open it
        openNewBook: function() {
            var that = this;

            dialogs.folder()
            .then(function(_path) {
                if (confirm("Do you really want to erase "+_path+" content and create a new book in it?")) {
                    Q.nfcall(wrench.copyDirRecursive, path.join(__dirname, "../example"), _path, {forceDelete: true})
                    .then(function() {
                        that.openPath(_path);
                    });
                }
            });
        },

        // Check update
        checkUpdate: function(signalNo) {
            update.isAvailable()
            .then(function(version) {
                dialogs.alert('Update', "An update is available ("+version+"), download it at http://www.gitbook.io");
            }, function() {
                if (signalNo) dialogs.alert('Update', "No update available. Check back soon!");
            });
        }
    });

    var app = new Application();
    app.run();
});
