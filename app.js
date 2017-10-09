// Generated by LiveScript 1.5.0
(function(){
  var root, express, htmlspecialchars, getsecret, jsYaml, Dropbox, dbx, app, basicAuth, passwords, mongo, MongoClient, mongourl, ref$, getMongoDb, getDropboxmediaCollection, getAccessTokenMongo, saveAccessTokenMongo, getAppKeySecretMongo, saveAppKeySecretMongo, get_app_key_secret, get_access_token, getdapp, getclient, sendhtml, showdir;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  express = require('express');
  htmlspecialchars = require('htmlspecialchars');
  getsecret = require('getsecret');
  jsYaml = require('js-yaml');
  Dropbox = require('dropbox');
  dbx = new Dropbox({
    accessToken: getsecret('dropbox_access_token')
  });
  app = express();
  app.set('port', process.env.PORT || 5000);
  app.listen(app.get('port'), '0.0.0.0');
  console.log('Listening on port ' + app.get('port'));
  if (process.env.PASSWORDS != null) {
    if (process.env.PORT != null) {
      app.use(require('force-ssl'));
    }
    basicAuth = require('basic-auth-connect');
    passwords = jsYaml.safeLoad(process.env.PASSWORDS);
    app.use(basicAuth(function(user, password){
      return user != null && password != null && user.length > 0 && password.length > 0 && passwords[user] != null && passwords[user] === password;
    }));
  }
  mongo = require('mongodb');
  MongoClient = mongo.MongoClient;
  mongourl = (ref$ = process.env.MONGOHQ_URL) != null
    ? ref$
    : (ref$ = process.env.MONGOLAB_URI) != null
      ? ref$
      : (ref$ = process.env.MONGOSOUP_URL) != null ? ref$ : 'mongodb://localhost:27017/default';
  getMongoDb = function(callback){
    return MongoClient.connect(mongourl, function(err, db){
      if (err) {
        console.log('error getting mongodb');
        return callback(null);
      } else {
        return callback(db);
      }
    });
  };
  getDropboxmediaCollection = function(callback){
    return getMongoDb(function(db){
      if (db == null) {
        callback(null, null);
        return;
      }
      return callback(db.collection('dropboxmedia'), db);
    });
  };
  getAccessTokenMongo = function(callback){
    return getDropboxmediaCollection(function(collection, db){
      if (db == null) {
        callback(null);
        return;
      }
      return collection.findOne({
        _id: 'accesstoken'
      }, function(err, result){
        if (result == null) {
          callback(null);
        } else {
          callback(JSON.parse(result.accesstoken));
        }
        return db.close();
      });
    });
  };
  saveAccessTokenMongo = function(newAccessToken, callback){
    return getDropboxmediaCollection(function(collection, db){
      if (db == null) {
        callback(null);
        return;
      }
      return collection.save({
        _id: 'accesstoken',
        accesstoken: JSON.stringify(newAccessToken)
      }, function(err, result){
        if (callback != null) {
          callback();
        }
        return db.close();
      });
    });
  };
  getAppKeySecretMongo = function(callback){
    return getDropboxmediaCollection(function(collection, db){
      if (db == null) {
        if (callback != null) {
          callback();
        }
        return;
      }
      return collection.findOne({
        _id: 'appkeysecret'
      }, function(err, result){
        if (result == null) {
          if (callback != null) {
            callback();
          }
          return;
        }
        callback(JSON.parse(result.appkeysecret));
        return db.close();
      });
    });
  };
  saveAppKeySecretMongo = function(newAppKeySecret, callback){
    return getDropboxmediaCollection(function(collection, db){
      if (db == null) {
        if (callback != null) {
          callback();
        }
        return;
      }
      return collection.save({
        _id: 'appkeysecret',
        appkeysecret: JSON.stringify(newAppKeySecret)
      }, function(err, result){
        if (callback != null) {
          callback();
        }
        return db.close();
      });
    });
  };
  root.app_key_secret = null;
  if (process.env.APP_KEY != null && process.env.APP_SECRET != null) {
    root.app_key_secret = {
      app_key: process.env.APP_KEY,
      app_secret: process.env.APP_SECRET
    };
  }
  root.access_token = null;
  if (process.env.ACCESS_TOKEN != null) {
    root.access_token = jsYaml.safeLoad(process.env.ACCESS_TOKEN);
  }
  root.dapp = null;
  root.dclient = null;
  get_app_key_secret = function(callback){
    if (root.app_key_secret != null) {
      callback(root.app_key_secret);
      return;
    }
    return getAppKeySecretMongo(function(app_key_secret){
      if (app_key_secret != null) {
        root.app_key_secret = app_key_secret;
        callback(root.app_key_secret);
        return;
      }
      console.log('missing app_key_secret');
      return callback(null);
    });
  };
  get_access_token = function(callback){
    if (root.access_token != null) {
      callback(root.access_token);
      return;
    }
    return getAccessTokenMongo(function(access_token){
      if (access_token != null) {
        root.access_token = access_token;
        callback(root.access_token);
        return;
      }
      return callback(null);
    });
  };
  getdapp = function(callback){
    if (root.dapp != null) {
      callback(root.dapp);
      return;
    }
    return get_app_key_secret(function(app_key_secret){
      if (!(app_key_secret != null && app_key_secret.app_key != null && app_key_secret.app_secret != null)) {
        callback(null);
        return;
      }
      root.dapp = dbox.app(app_key_secret);
      return callback(root.dapp);
    });
  };
  getclient = function(callback){
    if (root.dclient != null) {
      callback(root.dclient);
      return;
    }
    return getdapp(function(dapp){
      if (dapp == null) {
        callback(null);
        return;
      }
      return get_access_token(function(access_token){
        if (access_token == null) {
          callback(null);
          return;
        }
        root.dclient = dapp.client(root.access_token);
        return callback(root.dclient);
      });
    });
  };
  sendhtml = function(res, sometext){
    res.set('Content-Type', 'text/html');
    return res.send("<html>\n<head></head>\n<body>\n" + sometext + "\n</body>\n</html>");
  };
  showdir = function(dirpath, dclient, res){
    return dclient.readdir(dirpath, function(status, reply){
      var output, i$, len$, filepath;
      output = [];
      output.push('<div>Powered by <a href="https://github.com/gkovacs/dropbox-media-server">Dropbox Media Server</a></div><br>');
      for (i$ = 0, len$ = reply.length; i$ < len$; ++i$) {
        filepath = reply[i$];
        if (filepath[0] === '/') {
          filepath = filepath.slice(1);
        }
        output.push("<div><a href=\"/f/" + encodeURIComponent(filepath) + "\">" + htmlspecialchars(filepath) + "</a></div>");
      }
      return sendhtml(res, output.join(''));
    });
  };
  showdir = async function(dirpath, res){
    var response, filepaths, i$, ref$, len$, fileinfo, filepath, output;
    response = (await dbx.filesListFolder({
      path: dirpath,
      recursive: true
    }));
    filepaths = [];
    for (i$ = 0, len$ = (ref$ = response.entries).length; i$ < len$; ++i$) {
      fileinfo = ref$[i$];
      if (fileinfo['.tag'] !== 'file') {
        continue;
      }
      filepath = fileinfo.path_display;
      if (filepath[0] === '/') {
        filepath = filepath.slice(1);
      }
      filepaths.push(filepath);
    }
    filepaths.sort();
    output = [];
    for (i$ = 0, len$ = filepaths.length; i$ < len$; ++i$) {
      filepath = filepaths[i$];
      output.push("<div><a href=\"/f/" + encodeURIComponent(filepath) + "\">" + htmlspecialchars(filepath) + "</a></div>");
    }
    return sendhtml(res, output.join(''));
  };
  app.get('/', async function(req, res){
    return showdir('', res);
  });
  app.get('/robots.txt', function(req, res){
    res.set('Content-Type', 'text/plain');
    return res.send('User-agent: *\nDisallow: /');
  });
  app.get('/mongostatus', function(req, res){
    return getMongoDb(function(db){
      if (db != null) {
        return res.send('mongo ok');
      } else {
        return res.send('mongo not working');
      }
    });
  });
  app.get('/listfiles', async function(req, res){
    var response, filepaths, i$, ref$, len$, fileinfo, filepath;
    response = (await dbx.filesListFolder({
      path: '',
      recursive: true
    }));
    filepaths = [];
    for (i$ = 0, len$ = (ref$ = response.entries).length; i$ < len$; ++i$) {
      fileinfo = ref$[i$];
      if (fileinfo['.tag'] !== 'file') {
        continue;
      }
      filepath = fileinfo.path_display;
      if (filepath[0] === '/') {
        filepath = filepath.slice(1);
      }
      filepaths.push(filepath);
    }
    filepaths.sort();
    return res.send(JSON.stringify(filepaths));
  });
  /*
  app.get '/account', (req, res) ->
    getclient (dclient) ->
      if not dclient?
        res.send 'need to login first'
        return
      dclient.account (status, reply) ->
        res.send JSON.stringify reply
  */
  root.cached_paths = {};
  app.get('/f', async function(req, res){
    return showdir('', res);
  });
  app.get(/^\/f\/(.+)/, async function(req, res){
    var filename, current_time, fileinfo;
    filename = req.params[0];
    if (filename == null || filename.length === 0) {
      res.send('need filename');
      return;
    }
    current_time = Date.now();
    if (root.cached_paths[filename] != null && current_time < root.cached_paths[filename].timestamp + 1000 * 3600 * 3.9) {
      res.redirect(root.cached_paths[filename].link);
      return;
    }
    fileinfo = (await dbx.filesGetTemporaryLink({
      path: '/' + filename
    }));
    root.cached_paths[filename] = {
      link: fileinfo.link,
      timestamp: current_time
    };
    res.redirect(fileinfo.link);
  });
  /*
  app.get /^\/f\/(.+)/, (req, res) ->>
    # this allow subdirectories, is /file/foo/bar.txt
    # if wanted just flat files, would use '/file/:filename'
    filename = req.params[0]
    if not filename? or filename.length == 0
      res.send 'need filename'
      return
    if root.cached_paths[filename]? and new Date(root.cached_paths[filename].expires).getTime() > Date.now() # not expired yet
      res.redirect root.cached_paths[filename].url
      return
    getclient (dclient) ->
      if not dclient?
        res.send 'need to login first'
        return
      dclient.media '/' + filename, (status, reply) ->
        if not reply?
          res.send 'no reply for file: ' + filename
          return
        if reply.error?
          if reply.error == 'Creating a link for a directory is not allowed.'
            showdir '/' + filename, dclient, res
          else
            res.send 'error for file ' + filename + ': ' + JSON.stringify(reply.error)
          return
        root.cached_paths[filename] = reply
        res.redirect reply.url
  */
}).call(this);
