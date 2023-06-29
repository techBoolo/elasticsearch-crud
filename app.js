const express = require('express')
require('express-async-errors')
const { clientsInfo } = require('./utils/client.js')
const gameOfThronesRoute = require('./routes/game-of-thrones.js')
const indicesRoute = require('./routes/indices.js')
const testRoute = require('./routes/test.js')
const postRoute = require('./routes/post.js')

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).json({ message: 'it works' })
})

// client cluster info
app.get('/info', (req, res) => {
  const client-info = await clientInfo()

  res.status(200).json(client-info)
})

// indices
app.use('/indices', indicesRoute)

// game of thrones
app.use('/game-of-thrones', gameOfThronesRoute)

// test 
app.use('/test', testRoute)

// posts
app.use('/posts', postRoute)

module.exports = app
