const express = require('express')
require('express-async-errors')
const ErrorResponse = require('./utils/errorResponse.js')
const { clientInfo } = require('./utils/client.js')
const gameOfThronesRoute = require('./routes/game-of-thrones.js')
const indicesRoute = require('./routes/indices.js')
const testRoute = require('./routes/test.js')
const postRoute = require('./routes/post.js')
const logRoute = require('./routes/log.js')
const userRoute = require('./routes/user.js')
const client = require('./elastic-client.js')

const app = express()

app.use(express.json())

// root, test route
app.get('/', async (req, res) => {
  res.status(200).json({ message: 'it works' })
})

// client cluster info
app.get('/info', async (req, res) => {
  const clientinfo = await clientInfo()

  res.status(200).json(clientinfo)
})

// indices
app.use('/indices', indicesRoute)

// game of thrones
app.use('/game-of-thrones', gameOfThronesRoute)

// test 
app.use('/test', testRoute)

// posts
app.use('/posts', postRoute)

// logs
app.use('/logs', logRoute)

// user
app.use('/user', userRoute)


// route not found
app.use((req, res, next) => {
  const error = new ErrorResponse({ 
    statusCode: 404, 
    message: 'Route not found' 
  })
  next(error)
})

// error handling
app.use((error, req, res, next) => {
  console.dir(error?.meta?.body, { depth: null });
  res.status(error.statusCode || 500)
  res.json({
    error: {
      message: error.message
    }
  })
})

module.exports = app
