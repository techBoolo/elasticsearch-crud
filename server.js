const http = require('node:http')
const app = require('./app.js')
const elasticClient = require('./elastic-client.js')

const server = http.createServer()
const PORT = 3001

server.on('request', app)

elasticClient.ping()
  .then(() => {
    console.log('\nelasticsearch connection established\n');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
  })
  .catch(err => {
    console.log(err);
    console.log('\nError connecting to elasticsearch, look the log above for more detail\n');
    process.exit(1)
  })
