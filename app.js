// Generated by LiveScript 1.3.1
(function(){
  var root, express, dbox, htmlspecialchars, jsYaml, app, basicAuth, passwords, mongo, MongoClient, mongourl, ref$, getMongoDb, getDropboxmediaCollection, getAccessTokenMongo, saveAccessTokenMongo, getAppKeySecretMongo, saveAppKeySecretMongo, get_app_key_secret, get_access_token, getdapp, getclient, sendhtml, showdir;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  express = require('express');
  dbox = require('dbox');
  htmlspecialchars = require('htmlspecialchars');
  jsYaml = require('js-yaml');
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
        callback(null);
        return;
      }
      return collection.findOne({
        _id: 'appkeysecret'
      }, function(err, result){
        if (result == null) {
          callback(null);
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
        callback(null);
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
  app.get('/', function(req, res){
    return getclient(function(dclient){
      if (dclient != null) {
        showdir('/', dclient, res);
        return;
      }
      return get_app_key_secret(function(app_key_secret){
        if (app_key_secret == null) {
          if (req.query != null && req.query.app_key != null && req.query.app_secret != null) {
            root.app_key_secret = {
              app_key: req.query.app_key,
              app_secret: req.query.app_secret
            };
            saveAppKeySecretMongo(root.app_key_secret);
            res.send('saved app_key and app_secret');
          }
          if (!(root.app_key_secret != null && root.app_key_secret.app_key != null && root.app_key_secret.app_secret != null)) {
            res.send('need app_key and app_secret parameters. specify them as: <br>\n/?app_key=APPKEY&app_secret=APPSECRET <br>\nvisit <a href="https://www.dropbox.com/developers/apps" target="_blank">https://www.dropbox.com/developers/apps</a> to get an app key');
          }
          return;
        }
        return getdapp(function(dapp){
          return dapp.requesttoken(function(status, request_token){
            var token_url;
            token_url = "https://www.dropbox.com/1/oauth/authorize?oauth_token=" + request_token.oauth_token;
            sendhtml(res, "<a href=" + token_url + ">" + token_url + "</a>");
            return root.checkauthorizedprocess = setInterval(function(){
              return root.dapp.accesstoken(request_token, function(status, access_token){
                if (access_token != null && access_token.oauth_token != null) {
                  root.access_token = access_token;
                  root.dclient = root.dapp.client(access_token);
                }
                if (root.access_token != null) {
                  clearInterval(root.checkauthorizedprocess);
                  console.log('ACCESS_TOKEN: ' + JSON.stringify(root.access_token));
                  return saveAccessTokenMongo(root.access_token);
                }
              });
            }, 1000);
          });
        });
      });
    });
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
  app.get('/listfiles', function(req, res){
    return getclient(function(dclient){
      if (dclient == null) {
        res.send('need to login first');
        return;
      }
      return dclient.readdir('/', function(status, reply){
        return res.send(JSON.stringify(reply));
      });
    });
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
  app.get('/f', function(req, res){
    return getclient(function(dclient){
      if (dclient == null) {
        res.send('need to login first');
        return;
      }
      showdir('/', dclient, res);
    });
  });
  app.get(/^\/f\/(.+)/, function(req, res){
    var filename;
    filename = req.params[0];
    if (filename == null || filename.length === 0) {
      res.send('need filename');
      return;
    }
    if (root.cached_paths[filename] != null && new Date(root.cached_paths[filename].expires).getTime() > Date.now()) {
      res.redirect(root.cached_paths[filename].url);
      return;
    }
    return getclient(function(dclient){
      if (dclient == null) {
        res.send('need to login first');
        return;
      }
      return dclient.media('/' + filename, function(status, reply){
        if (reply == null) {
          res.send('no reply for file: ' + filename);
          return;
        }
        if (reply.error != null) {
          if (reply.error === 'Creating a link for a directory is not allowed.') {
            showdir('/' + filename, dclient, res);
          } else {
            res.send('error for file ' + filename + ': ' + JSON.stringify(reply.error));
          }
          return;
        }
        root.cached_paths[filename] = reply;
        return res.redirect(reply.url);
      });
    });
  });
}).call(this);
