'use strict'
const env = require('env2')('./config.env');
const hapi = require('hapi')
const querystring = require('querystring') //format params for queries
const iron = require('iron') //encryption lib
const boom = require('boom') // adds reply methods
const { httpsRequest, buildUrl } = require('./utils')

const goodOptions = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout'],
        http: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ error: '*' }]
        }, {
            module: 'good-http',
            args: ['http://prod.logs:3000', {
                wreck: {
                    headers: { 'x-api-key': 12345 }
                }
            }]
        }]
    }
};
const server = new hapi.Server()
server.connection({
  port: process.env.PORT
})
server.register([
  require('inert'), { register: require('good'), options: goodOptions }
],()=>{})

server.route({
  method:'GET',
  path:'/',
  handler:(req,reply)=>{
    reply.file('./hello.html') 
  }
})
server.route({
  method:'GET',
  path:'/login',
  handler:(req,reply)=>{
    reply.redirect(buildUrl())
  }
})
server.route({
  method:'GET',
  path:'/authorized',
  handler:(req,reply)=>{
    httpsRequest({
      hostname:'github.com',
      port: 443,
      method:'POST',
      path: '/login/oauth/access_token',
      headers:{
        'Accept':'application/json'
      },
      body: querystring.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET, 
        code: req.query.code
      }) 
    }, (res)=>{ 
      server.app.access_token = JSON.parse(res).access_token;
      console.log('content of server.app.access_token :',server.app.access_token)
      reply.file('./authorized.html')
        .state(process.env.USER_ID, server.app.access_token, {
          ttl: 60*60*1000,
          isHttpOnly: true,
          encoding:'iron',
          password: process.env.IRON_SECRET
        })
        .redirect('/restricted')
    }) 
  }
})

server.route({
  method:'GET',
  path:'/restricted',
  handler:(req,reply)=>{
    iron.unseal(req.state[process.env.USER_ID], process.env.IRON_SECRET, iron.defaults, function (err, unsealed) {
      if(err)throw err
      console.log('unsealed is: ', unsealed, 'saved token is: ', server.app.access_token)
      if(unsealed === server.app.access_token){
        reply.file('./hello_res.html')
      } else reply(boom.unauthorized('login to see this page'))
    });
  }
})
server.route({
  method:'GET',
  path:'/user/{user}',
  handler:(req,reply)=>{
    httpsRequest({
      hostname:'github.com',
      port: 443,
      method:'GET',
      path: querystring.stringify({
        user:req.params.user,
        access_token:server.app.access_token
      }),
      headers:{
        'Accept':'application/json'
      },

    }, (res)=>{console.log(res)})
    reply.file('./user.html') 
  }
})

server.start((err)=>{
  if(err) throw err
  console.log('server is running on port:', process.env.PORT)
  console.log(process.env.BASE_URL)
})


