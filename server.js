const http = require('node:http')
const app = require('./app.js')

const server = http.createServer()
const PORT = 3001

server.on('request', app)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
