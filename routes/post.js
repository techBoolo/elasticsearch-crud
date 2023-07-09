const express = require('express')
const client = require('../elastic-client.js')

const router = express.Router()

  // we could define this functions in the controller
// index({index: 'string', document: {}})
exports.createPost = async (data) => {
  return await client.index({
    index: 'posts',
    document: {
      author: data.author,
      title: data.title,
      content: data.content
    }
  })
}

exports.getPostsCount = async (query) => {
  console.log('query', query);
  const result = await client.count({ 
    index: 'posts',
    query: {
      bool: {
        must: query
      }
    }
  })
  return result.count
}

exports.getPosts = async () => {
  // use from and size for pagination
  return await client.search({
    from: 0,
    size: 2,
    index: 'posts'
  })
}

exports.getPost = async (id) => {
  return await client.get({
    index: 'posts',
    id 
  })
}

router.route('/:id')
  .get( async (req, res) => {
    const { id } = req.params
    const response = await getPost(id)

    const post = { id: response._id, data: response._source }
    console.log(post);
    res.status(200).json(post)
  })

router.route('/posts')
  .get(async (req, res) => {
    const defaultSize = 1
    const queryObject = req.query
    const must = []
    
    if(Object.hasOwn(queryObject, 'author')) {
      const authorMatch = { match: { 'author': queryObject['author']}}
      must.push(authorMatch)
    }
    if(Object.hasOwn(queryObject, 'title')) {
      const titleMatch = { term: { 'title.keyword': queryObject['title']}}
      must.push(titleMatch)
    }
    
    const count = await getPostsCount(must)
    const response = await getPosts()
    const posts = response.hits.hits.map(post => ({
      id: post._id,
      data: post._source
    }))

    res.status(200).json(posts)
  })
  .post(async (req, res) => {
    const body = req.body
    
    const result = await createPost(body)
    // @response
    // {
    //  _index: 'posts',
    //  _id: 'some random string',
    //  result: 'created'
    // }
    // by default it doesn't return the doc so use 
    // _source: true option to return the created doc
    res.send(result)
})

module.exports = router
