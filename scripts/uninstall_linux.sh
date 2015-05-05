#!/bin/bash

# This script need to be stored with content of app release for linux

# Vendor name
VENDOR=friendcode

# User who is running the installer
USER=$(whoami)

# Removing base folder
GITBOOK_PATH=/home/$USER/.gitbook

if [ -e $GITBOOK_PATH ]
then
    echo  "Removing .gitbook folder"
    rm -rf $GITBOOK_PATH
    echo ""
fi

# Removing desktop entry
FILE_DESKTOP=$VENDOR-gitbook.desktop

echo "Remove the shortcut from Desktop"
rm -f /home/$USER/Desktop/$FILE_DESKTOP
echo ""

FILE_DIRECTORYENTRY=$VENDOR-gitbook.directory

echo "Uninstalling from Applications menu"
xdg-desktop-menu uninstall $FILE_DIRECTORYENTRY $FILE_DESKTOP
xdg-desktop-menu forceupdate
echo ""

echo "GitBook was removed from your desktop"
