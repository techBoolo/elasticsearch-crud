const express = require('express')
require('express-async-errors')

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).json({ message: 'it works' })
})

module.exports = app
