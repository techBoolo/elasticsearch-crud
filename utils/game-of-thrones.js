const client = require('../elastic-client.js')

exports.getGameOfThrones = async () => {
  return await client.get({
    index: 'game-of-thrones'
  })
}
