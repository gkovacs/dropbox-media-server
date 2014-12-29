root = exports ? this

require! {
  express
  dbox
}

# express setup

app = express()

app.set 'port', (process.env.PORT || 5000)
app.listen app.get('port'), '0.0.0.0'
console.log 'Listening on port ' + app.get('port')

# mongo setup

mongo = require 'mongodb'
{MongoClient} = mongo

mongourl = process.env.MONGOHQ_URL
if not mongourl?
  mongourl = process.env.MONGOLAB_URI
if not mongourl?
  mongourl = 'mongodb://localhost:27017/default'

# mongo authentication caches

get-mongo-db = (callback) ->
  MongoClient.connect mongourl, (err, db) ->
    if err
      console.log 'error getting mongodb'
      callback null
    else
      callback db

get-dropboxmedia-collection = (callback) ->
  get-mongo-db (db) ->
    if not db?
      callback null, null
      return
    callback db.collection('dropboxmedia'), db

get-access-token-mongo = (callback) ->
  get-dropboxmedia-collection (collection, db) ->
    if not db?
      callback null
      return
    collection.findOne {_id: 'accesstoken'}, (err, result) ->
      if not result?
        callback null
      else
        callback JSON.parse(result.accesstoken)
      db.close()

save-access-token-mongo = (new-access-token, callback) ->
  get-dropboxmedia-collection (collection, db) ->
    if not db?
      callback null
      return
    collection.save {_id: 'accesstoken', accesstoken: JSON.stringify(new-access-token)}, (err, result) ->
      if callback?
        callback()
      db.close()

get-app-key-secret-mongo = (callback) ->
  get-dropboxmedia-collection (collection, db) ->
    if not db?
      callback null
      return
    collection.findOne {_id: 'appkeysecret'}, (err, result) ->
      if not result?
        callback null
        return
      callback JSON.parse(result.appkeysecret)
      db.close()

save-app-key-secret-mongo = (new-app-key-secret, callback) ->
  get-dropboxmedia-collection (collection, db) ->
    if not db?
      callback null
      return
    collection.save {_id: 'appkeysecret', appkeysecret: JSON.stringify(new-app-key-secret)}, (err, result) ->
      if callback?
        callback()
      db.close()

# global variables

root.app_key_secret = null
root.access_token = null
root.dapp = null
root.dclient = null

# get statements

get_app_key_secret = (callback) ->
  if root.app_key_secret?
    callback root.app_key_secret
    return
  get-app-key-secret-mongo (app_key_secret) ->
    if app_key_secret?
      root.app_key_secret = app_key_secret
      callback root.app_key_secret
      return
    console.log 'missing app_key_secret'
    callback null

get_access_token = (callback) ->
  if root.access_token?
    callback root.access_token
    return
  get-access-token-mongo (access_token) ->
    if access_token?
      root.access_token = access_token
      callback root.access_token
      return
    callback null

getdapp = (callback) ->
  if root.dapp?
    callback root.dapp
    return
  get_app_key_secret (app_key_secret) ->
    if not (app_key_secret? and app_key_secret.app_key? and app_key_secret.app_secret?)
      callback null
      return
    root.dapp = dbox.app app_key_secret
    callback root.dapp

getclient = (callback) ->
  if root.dclient?
    callback root.dclient
    return
  getdapp (dapp) ->
    if not dapp?
      callback null
      return
    get_access_token (access_token) ->
      if not access_token?
        callback null
        return
      root.dclient = dapp.client root.access_token
      callback root.dclient

sendhtml = (res, sometext) ->
  res.set 'Content-Type', 'text/html'
  res.send """
  <html>
  <head></head>
  <body>
  #{sometext}
  </body>
  </html>
  """

app.get '/', (req, res) ->
  getclient (dclient) ->
    if dclient?
      #sendhtml res, 'Powered by <a href="https://github.com/gkovacs/dropbox-media-server">Dropbox Media Server</a>'
      dclient.readdir '/', (status, reply) ->
        #console.log status
        #console.log reply
        output = []
        output.push '<div>Powered by <a href="https://github.com/gkovacs/dropbox-media-server">Dropbox Media Server</a></div><br><br>'
        for filepath in reply
          output.push "<div><a href='#{filepath}'>#{filepath}</a></div>"
        sendhtml res, output.join('')
      return
    get_app_key_secret (app_key_secret) ->
      if not app_key_secret?
        if req.query? and req.query.app_key? and req.query.app_secret?
          root.app_key_secret = {app_key: req.query.app_key, app_secret: req.query.app_secret}
          save-app-key-secret-mongo root.app_key_secret
          res.send '''
          saved app_key and app_secret
          '''
        if not (root.app_key_secret? and root.app_key_secret.app_key? and root.app_key_secret.app_secret?)
          res.send '''
          need app_key and app_secret parameters. specify them as: <br>
          /?app_key=APPKEY&app_secret=APPSECRET <br>
          visit <a href="https://www.dropbox.com/developers/apps" target="_blank">https://www.dropbox.com/developers/apps</a> to get an app key'''
        return
      getdapp (dapp) ->
        dapp.requesttoken (status, request_token) ->
          token_url = "https://www.dropbox.com/1/oauth/authorize?oauth_token=#{request_token.oauth_token}"
          sendhtml res, "<a href=#{token_url}>#{token_url}</a>"
          root.checkauthorizedprocess = setInterval ->
            root.dapp.accesstoken request_token, (status, access_token) ->
              #console.log status
              #console.log access_token
              if access_token? and access_token.oauth_token?
                root.access_token = access_token
                root.dclient = root.dapp.client access_token
              if root.access_token?
                clearInterval root.checkauthorizedprocess
                save-access-token-mongo(root.access_token)
          , 1000

app.get '/robots.txt', (req, res) ->
  res.set 'Content-Type', 'text/plain'
  res.send '''
  User-agent: *
  Disallow: /
  '''

app.get '/mongostatus', (req, res) ->
  get-mongo-db (db) ->
    if db?
      res.send 'mongo ok'
    else
      res.send 'mongo not working'

app.get '/listfiles', (req, res) ->
  getclient (dclient) ->
    if not dclient?
      res.send 'need to login first'
      return
    dclient.readdir '/', (status, reply) ->
      #console.log status
      #console.log reply
      res.send JSON.stringify reply

/*
app.get '/account', (req, res) ->
  getclient (dclient) ->
    if not dclient?
      res.send 'need to login first'
      return
    dclient.account (status, reply) ->
      res.send JSON.stringify reply
*/

root.cached_paths = {}

app.get /^\/file\/(.+)/, (req, res) ->
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
      #console.log reply
      root.cached_paths[filename] = reply
      res.redirect reply.url

