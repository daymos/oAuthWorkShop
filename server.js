'use strict'
const env = require('env2')('./config.env');
const hapi = require('hapi')
const port = 3000
const server = new hapi.Server()
const querystring = require('querystring') 
const { httpsRequest, buildUrl } = require('./utils')

console.log(httpsRequest)
server.connection({port: port})
server.register([require('inert')],()=>{})

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
      console.log(server.app.access_token)
      reply.file('./authorized.html')
    }) 
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
  console.log('server is running on port:', port)
  console.log(process.env.BASE_URL)
})





