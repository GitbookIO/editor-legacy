# GitBook Editor

This application is a simple editor for writing books. It's available for Windows, Linux (32 and 64bits) and Mac.

![Alt text](/preview.png?raw=true "Preview")

### How to install it?

Download it from [https://github.com/GitbookIO/editor-legacy/releases](https://github.com/GitbookIO/editor-legacy/releases).

#### How to install it on Mac:

1. Download *gitbook-mac.dmg*
2. Open the file
3. Copy the Codebox application to your mac's *Applications* folder
4. Open it and start working

#### How to install it on Linux:

1. Download *gitbook-linux32.tar.gz*
2. Extract it using: ```tar -xvzf gitbook-linux32.tar.gz```
3. Run the installation script ```cd GitBook && ./install.sh```
4. There is now a shortcut on your desktop
5. Open it and start working

#### How to install it on Windows:

1. Download *gitbook-win.zip*
2. Extract it using a ZIP tool
3. Copy the `GitBook` folder to your desktop
4. Open `GitBook.exe` and start working


### How to test it for development?

`nw` is an alias for node-webkit (version > 0.10.0).

```
$ npm install .
$ grunt build
$ nw ./ --remote-debugging-port=9222
```
