# Dropbox Media Server

Node.js server that serves a public folder of media files on Dropbox

## Why

Dropbox is a great means of hosting large files, but you can share only individual files, not individual links for a directory of files - the URLs for files are obfuscated for within folders.

This is a node.js server you can run on Heroku that exposes a directory without obfuscated paths, and redirects you to the appropriate file on Dropbox whenever you try to access a file.

## Deploying on Heroku

Create a new app on [Dropbox](https://www.dropbox.com/developers/apps)

Create a new app on [Heroku](https://dashboard.heroku.com/apps)

(Optional) Add either [MongoHQ](https://addons.heroku.com/mongohq) or [MongoLab](https://addons.heroku.com/mongolab) or [MongoSoup](https://addons.heroku.com/mongosoup) to the app

Add to the Heroku app the config vars APP\_KEY and APP\_SECRET with the app key and secret from Dropbox (or if you added mongodb, you can alternatively specify the app key and secret by visiting the site after deploying it).

Deploy this repository to Heroku via git push:

    git clone https://github.com/gkovacs/dropbox-media-server
    cd dropbox-media-server
    git remote add myapp git@heroku.com:myapp.git
    git push myapp master

Visit your site at http://myapp.herokuapp.com and give it authorization. If you did not add mongodb, you will have to set the ACCESS\_TOKEN heroku config var to output of the following:

    heroku logs --app myapp | grep 'ACCESS_TOKEN'

Now you can add some files to the Dropbox folder at Dropbox/Apps/myapp and if you visit your site at http://myapp.herokuapp.com then it will show them.

## Features

To list the files as JSON: /listfiles

To access a file: /f/path/to/file.txt

To see if mongo db has an error: /mongostatus

To password-protect with HTTP Basic Auth over HTTPS: Add Heroku config var "PASSWORDS", which is JSON with usernames as keys and values as passwords, ie {"user1": "password1", "user2": "password2"}

## License

MIT License

## Contact

[Geza Kovacs](http://www.gkovacs.com/)
