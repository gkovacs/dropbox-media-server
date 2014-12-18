# Dropbox Media Server

Node.js server that serves a public folder of media files on Dropbox

## Why

Dropbox is a great means of hosting large files, but you can share only individual files, not individual links for a directory of files - the URLs for files are obfuscated for within folders.

This is a node.js server you can run on Heroku that exposes a directory without obfuscated paths, and redirects you to the appropriate file on Dropbox whenever you try to access a file.

## Deploying on Heroku

Create a new app on Heroku: https://dashboard.heroku.com/apps

Add either MongoHQ https://addons.heroku.com/mongohq or MongoLab https://addons.heroku.com/mongolab to the app

Deploy this repository to Heroku via git push:

    git clone https://github.com/gkovacs/dropbox-media-server
    cd dropbox-media-server
    git remote add myapp git@heroku.com:myapp.git
    git push myapp master

Create a new app on Dropbox: https://www.dropbox.com/developers/apps

Visit your site, specify the app\_key and app\_secret, give it authorization, add some files to the Dropbox folder at Dropbox/Apps/myapp

## Features

To list the files: /listfiles

To access a file: /file/path/to/file.txt

To see if mongo db has an error: /mongostatus
