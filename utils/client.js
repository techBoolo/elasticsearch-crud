const client = require('../elastic-client.js')

exports.clientInfo = async () => {
  return await client.info()
}

