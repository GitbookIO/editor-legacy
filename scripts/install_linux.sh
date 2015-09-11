#!/bin/bash

# This script need to be stored with content of app release for linux

# Vendor name
VENDOR=friendcode

# User who is running the installer
USER=$(whoami)

# Home is bash shell define user home
HOME=$HOME

# DESKTOP is X Window define Desktop
DESKTOP_CONFIG=`grep XDG_DESKTOP_DIR= $HOME/.config/user-dirs.dirs | sed s/XDG_DESKTOP_DIR=//g | sed s/\"//g`
DESKTOP_TARGET=${DESKTOP_CONFIG/'$HOME'/$HOME}

# Folder to install gitbook too
GITBOOK_PATH=$HOME/.gitbook

# Folder with gitbook files to install
SCRIPTPATH=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Removing base folder if already exists
if [ -e $GITBOOK_PATH ]
then
    echo  "Removing old .gitbook folder"
    rm -rf $GITBOOK_PATH
    echo ""
fi

# Creating base folder
echo "Creating $GITBOOK_PATH"
mkdir -p $GITBOOK_PATH
echo ""

# Copying files
echo  "Copying files from $SCRIPTPATH"
cp -r $SCRIPTPATH/* $GITBOOK_PATH
echo ""

# Linking libudev.so.1
echo "Linking libudev.so.1"
paths=(
  "/lib/x86_64-linux-gnu/libudev.so.1" # Ubuntu, Xubuntu, Mint
  "/usr/lib64/libudev.so.1" # SUSE, Fedora
  "/usr/lib/libudev.so.1" # Arch, Fedora 32bit
  "/lib/i386-linux-gnu/libudev.so.1" # Ubuntu 32bit
)
for i in "${paths[@]}"
do
  if [ -f $i ]
  then
    ln -sf "$i" $GITBOOK_PATH/libudev.so.0
    break
  fi
done
echo ""

# Create desktop entry
FILE_DESKTOP=$VENDOR-gitbook.desktop
touch $FILE_DESKTOP
echo "[Desktop Entry]" >> $FILE_DESKTOP
echo "Type=Application" >> $FILE_DESKTOP
echo "Encoding=UTF-8" >> $FILE_DESKTOP
echo "Name=GitBook" >> $FILE_DESKTOP
echo "GenericName=Code Editor" >> $FILE_DESKTOP
echo "Comment=Code Editor" >> $FILE_DESKTOP
echo "Exec=bash $GITBOOK_PATH/start.sh" >> $FILE_DESKTOP
echo "Icon= $GITBOOK_PATH/icon.png"  >> $FILE_DESKTOP
echo "Categories=Development;Utilities;TextEditor" >> $FILE_DESKTOP
echo "Terminal=false" >> $FILE_DESKTOP

echo "Granting the shortcut execution permissions"
cp $FILE_DESKTOP $DESKTOP_TARGET
chmod +x $DESKTOP_TARGET/$FILE_DESKTOP
echo ""

echo "Writing desktop menu item"
FILE_DIRECTORYENTRY=$VENDOR-gitbook.directory
touch $FILE_DIRECTORYENTRY
echo "[Desktop Entry]" >> $FILE_DIRECTORYENTRY
echo "Value=1.0" >> $FILE_DIRECTORYENTRY
echo "Type=Directory" >> $FILE_DIRECTORYENTRY
echo "Encoding=UTF-8" >> $FILE_DIRECTORYENTRY
echo "Name=GitBook" >> $FILE_DIRECTORYENTRY
echo "Comment=Code Editor" >> $FILE_DIRECTORYENTRY
echo "Icon= $GITBOOK_PATH/icon.png"  >> $FILE_DIRECTORYENTRY
echo "done"
echo ""

echo "Installing to Applications menu"
xdg-desktop-menu install $FILE_DIRECTORYENTRY $FILE_DESKTOP
xdg-desktop-menu forceupdate
echo ""

echo "Cleaning"
rm $FILE_DIRECTORYENTRY $FILE_DESKTOP
echo ""

echo "GitBook is now installed on your desktop"
