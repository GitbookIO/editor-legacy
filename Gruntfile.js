var path = require("path");
var _ = require("lodash");

module.exports = function (grunt) {
    // Path to the client src
    var srcPath = path.resolve(__dirname, "src");

    // Load grunt modules
    grunt.loadNpmTasks('hr.js');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-node-webkit-builder');

    var NW_VERSION = "0.9.2";

    // Init GRUNT configuraton
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        hr: {
            app: {
                // Base directory for the application
                "base": srcPath,

                // Application name
                "name": "Codebox",

                // Mode debug
                "debug": true,

                // Main entry point for application
                "main": "main",

                // HTML entry point
                'index': grunt.file.read(path.resolve(srcPath, "index.html")),

                // Build output directory
                "build": path.resolve(__dirname, "build"),

                // Static files mappage
                "static": {
                    "ace": path.resolve(srcPath, "vendors", "ace"),
                    "fonts": path.resolve(srcPath, "resources", "fonts"),
                    "images": path.resolve(srcPath, "resources", "images")
                },

                // Stylesheet entry point
                "style": path.resolve(srcPath, "resources/stylesheets/main.less"),

                // Modules paths
                'paths': {
                    "octokit": "../node_modules/octokit/octokit",
                    "ace": "vendors/ace/ace"
                },
                "shim": {
                    "main": {
                        deps: [
                            'hr/dom',
                            'octokit',
                            'vendors/bootstrap/carousel',
                            'vendors/bootstrap/dropdown',
                            'vendors/bootstrap/button',
                            'vendors/bootstrap/modal',
                            'vendors/bootstrap/affix',
                            'vendors/bootstrap/alert',
                            'vendors/bootstrap/collapse',
                            'vendors/bootstrap/tooltip',
                            'vendors/bootstrap/popover',
                            'vendors/bootstrap/scrollspy',
                            'vendors/bootstrap/tab',
                            'vendors/bootstrap/transition'
                        ]
                    },
                    "ace": {
                        exports: "ace"
                    }
                },
                'args': {},
                'options': {}
            }
        },
        nodewebkit: {
            options: {
                app_name: "GitBook",
                build_dir: './appbuilds',
                mac: true,
                win: true,
                linux32: true,
                linux64: true,
                mac_icns: "./build/static/images/icons/512.icns",
                credits: "./src/credits.html",
                version: NW_VERSION,
                zip: false
            },
            src: [
                "./**/*",
                "!./appbuilds/**",
                "!./node_modules/hr.js/**",
                "!./node_modules/grunt-*/**",
                "!./node_modules/grunt/**",
                "!./node_modules/nw-gyp/**"
            ]
        },
        clean: {
            build: ['build/'],
            releases: ['appbuilds/releases']
        },
        exec: {
            build_mac_release: {
                command: "./scripts/build_mac.sh",
                cwd: './',
                stdout: true,
                stderr: true
            },
            build_win_release: {
                command: "./scripts/build_win.sh",
                cwd: './',
                stdout: true,
                stderr: true
            },
            build_linux32_release: {
                command: "./scripts/build_linux32.sh",
                cwd: './',
                stdout: true,
                stderr: true
            },
            build_linux64_release: {
                command: "./scripts/build_linux64.sh",
                cwd: './',
                stdout: true,
                stderr: true
            }
        },
        copy: {
            // Installer for linux
            linux32Installer: {
                cwd: './',
                src: 'scripts/install_linux.sh',
                dest: './appbuilds/releases/GitBook/linux32/GitBook/install.sh'
            },
            // Entry point for linux
            linux32Start: {
                cwd: './',
                src: 'scripts/linux_start.sh',
                dest: './appbuilds/releases/GitBook/linux32/GitBook/start.sh'
            },
            // Icon for linux
            linux32Icon: {
                cwd: './',
                src: './build/static/images/icons/128.png',
                dest: './appbuilds/releases/GitBook/linux32/GitBook/icon.png'
            },
            // Installer for linux
            linux64Installer: {
                cwd: './',
                src: 'scripts/install_linux.sh',
                dest: './appbuilds/releases/GitBook/linux64/GitBook/install.sh'
            },
            // Entry point for linux
            linux64Start: {
                cwd: './',
                src: 'scripts/linux_start.sh',
                dest: './appbuilds/releases/GitBook/linux64/GitBook/start.sh'
            },
            // Icon for linux
            linux64Icon: {
                cwd: './',
                src: './build/static/images/icons/128.png',
                dest: './appbuilds/releases/GitBook/linux64/GitBook/icon.png'
            },
        }
    });

    // Build
    grunt.registerTask('build', [
        'hr:app'
    ]);

    // Release
    grunt.registerTask('build-mac', [
        'exec:build_mac_release'
    ]);
    grunt.registerTask('build-win', [
        'exec:build_win_release'
    ]);
    grunt.registerTask('build-linux32', [
        'copy:linux32Installer',
        'copy:linux32Start',
        'copy:linux32Icon',
        'exec:build_linux32_release'
    ]);
    grunt.registerTask('build-linux64', [
        'copy:linux64Installer',
        'copy:linux64Start',
        'copy:linux64Icon',
        'exec:build_linux64_release'
    ]);
    grunt.registerTask('build-apps', [
        'clean:build',
        'clean:releases',
        'build',
        'nodewebkit',
        'build-linux32',
        'build-linux64',
        'build-mac',
        'build-win'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
