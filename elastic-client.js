require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')

const username = process.env.USER_NAME
const password = process.env.PASSWORD
const elasticClient = new Client({
  node: `https://${username}:${password}@localhost:9200`,
  caFingerPrint: process.env.CA_FINGER_PRINT,
  tls: {
    rejectUnauthorized: false
  }
})

module.exports = elasticClient
