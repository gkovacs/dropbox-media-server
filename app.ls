root = exports ? this

require! {
  express
  htmlspecialchars
  getsecret
  'js-yaml'
}

Dropbox = require 'dropbox'
dbx = new Dropbox({accessToken: getsecret('dropbox_access_token')})

# express setup

app = express()

app.set 'port', (process.env.PORT || 5000)
app.listen app.get('port'), '0.0.0.0'
console.log 'Listening on port ' + app.get('port')

# http basic authentication

if process.env.PASSWORDS?
  # force https
  if process.env.PORT? # is heroku
    app.use require('force-ssl')
  basicAuth = require 'basic-auth-connect'
  passwords = js-yaml.safeLoad process.env.PASSWORDS
  app.use basicAuth (user, password) ->
    return user? and password? and user.length > 0 and password.length > 0 and passwords[user]? and passwords[user] == password

# mongo setup

mongo = require 'mongodb'
{MongoClient} = mongo

mongourl = process.env.MONGOHQ_URL ? process.env.MONGOLAB_URI ? process.env.MONGOSOUP_URL ? 'mongodb://localhost:27017/default'

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
      if callback?
        callback()
      return
    collection.findOne {_id: 'appkeysecret'}, (err, result) ->
      if not result?
        if callback?
          callback()
        return
      callback JSON.parse(result.appkeysecret)
      db.close()

save-app-key-secret-mongo = (new-app-key-secret, callback) ->
  get-dropboxmedia-collection (collection, db) ->
    if not db?
      if callback?
        callback()
      return
    collection.save {_id: 'appkeysecret', appkeysecret: JSON.stringify(new-app-key-secret)}, (err, result) ->
      if callback?
        callback()
      db.close()

# global variables

root.app_key_secret = null
if process.env.APP_KEY? and process.env.APP_SECRET?
  root.app_key_secret = {
    app_key: process.env.APP_KEY
    app_secret: process.env.APP_SECRET
  }
root.access_token = null
if process.env.ACCESS_TOKEN?
  root.access_token = js-yaml.safeLoad process.env.ACCESS_TOKEN
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

showdir = (dirpath, res) ->>
  response = await dbx.filesListFolder({path: dirpath, recursive: true})
  filepaths = []
  for fileinfo in response.entries
    if fileinfo['.tag'] != 'file'
      continue
    filepath = fileinfo.path_display
    if filepath[0] == '/'
      filepath = filepath.slice(1)
    filepaths.push filepath
  filepaths.sort()
  output = []
  output.push '<div>Powered by <a href="https://github.com/gkovacs/dropbox-media-server">Dropbox Media Server</a> by <a href="http://www.gkovacs.com/">Geza Kovacs</a></div><br>'
  for filepath in filepaths
    output.push """<div><a href="/f/#{encodeURIComponent(filepath)}">#{htmlspecialchars(filepath)}</a></div>"""
  sendhtml res, output.join('')

app.get '/', (req, res) ->>
  showdir '', res

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

app.get '/listfiles', (req, res) ->>
  response = await dbx.filesListFolder({path: '', recursive: true})
  filepaths = []
  for fileinfo in response.entries
    if fileinfo['.tag'] != 'file'
      continue
    filepath = fileinfo.path_display
    if filepath[0] == '/'
      filepath = filepath.slice(1)
    filepaths.push filepath
  filepaths.sort()
  res.send JSON.stringify filepaths

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

app.get '/f', (req, res) ->>
  showdir '', res

app.get /^\/f\/(.+)/, (req, res) ->>
  # this allow subdirectories, is /file/foo/bar.txt
  # if wanted just flat files, would use '/file/:filename'
  filename = req.params[0]
  if not filename? or filename.length == 0
    res.send 'need filename'
    return
  current_time = Date.now()
  if root.cached_paths[filename]? and current_time < root.cached_paths[filename].timestamp + (1000*3600*3.9)
    res.redirect root.cached_paths[filename].link
    return
  fileinfo = await dbx.filesGetTemporaryLink {path: '/' + filename}
  root.cached_paths[filename] = {
    link: fileinfo.link
    timestamp: current_time
  }
  res.redirect fileinfo.link
  return
