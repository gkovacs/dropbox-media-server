// Generated by LiveScript 1.2.0
(function(){
  var root, express, dbox, app, mongo, MongoClient, mongourl, getMongoDb, getDropboxmediaCollection, getAccessTokenMongo, saveAccessTokenMongo, getAppKeySecretMongo, saveAppKeySecretMongo, get_app_key_secret, get_access_token, getdapp, getclient, sendhtml;
  root = typeof exports != 'undefined' && exports !== null ? exports : this;
  express = require('express');
  dbox = require('dbox');
  app = express();
  app.set('port', process.env.PORT || 5000);
  app.listen(app.get('port'), '0.0.0.0');
  console.log('Listening on port ' + app.get('port'));
  mongo = require('mongodb');
  MongoClient = mongo.MongoClient;
  mongourl = process.env.MONGOHQ_URL;
  if (mongourl == null) {
    mongourl = process.env.MONGOLAB_URI;
  }
  if (mongourl == null) {
    mongourl = 'mongodb://localhost:27017/default';
  }
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
  root.access_token = null;
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
    return res.send("<html>\n<head></head>\n<body>\n" + sometext + "\n</body>\n</html");
  };
  app.get('/', function(req, res){
    return getclient(function(dclient){
      if (dclient != null) {
        sendhtml(res, 'Powered by <a href="https://github.com/gkovacs/dropbox-media-server">Dropbox Media Server</a>');
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
                  return saveAccessTokenMongo(root.access_token);
                }
              });
            }, 1000);
          });
        });
      });
    });
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
  app.get(/^\/file\/(.+)/, function(req, res){
    var filename;
    filename = req.params[0];
    if (filename == null || filename.length === 0) {
      res.send('need filename');
      return;
    }
    return getclient(function(dclient){
      if (dclient == null) {
        res.send('need to login first');
        return;
      }
      return dclient.media('/' + filename, function(status, reply){
        return res.redirect(reply.url);
      });
    });
  });
}).call(this);
