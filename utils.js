'use strict'
const https = require('https')
const querystring = require('querystring') 

function httpsRequest(params, callback){
  let req = https.request(params, (res)=>{
    let response = ''
    res.on('data', (chunk)=>{
      response += chunk
    }) 
    res.on('end',(err)=>{
      if(err) throw err
      callback(response)
    })
  })
  req.on('err',(err)=>{
    console.log(err) 
  }) 
  try{
    req.write(params.body)
  } catch(e){
    if (e) console.log('no post request')
  }
  req.end()
}

function buildUrl(){
  let base = 'https://github.com/login/oauth/authorize'
  return base + '?'+ querystring.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    scope:'user'
  })
}
module.exports = {
  httpsRequest,
  buildUrl
}
