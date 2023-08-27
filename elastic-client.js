require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')

const username = process.env.USER_NAME
const password = process.env.PASSWORD
const elasticClient = new Client({
  // node: `https://${username}:${password}@127.0.0.1:9200`,

  node: 'https://127.0.0.1:9200',
  auth: {
    username,
    password
  },
  caFingerPrint: process.env.CA_FINGER_PRINT,
  tls: {
    rejectUnauthorized: false
  }
})

module.exports = elasticClient
