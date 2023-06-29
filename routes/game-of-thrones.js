const express = require('express')
const client = require('../elastic-client.js')

const router = express.Router()

router.route('/')
  .get(async (req, res) => {
    const result = await client.search({
      index: 'game-of-thrones'
    })
    res.status(200).json(result)
  })
  .post(async (req, res) => {
    const result = await client.index({
      index: 'game-of-thrones',
      document: {
        character: req.body.character,
        quote: req.body.quote,
      }
    })
    res.status(201).json(result)
  })
  .patch(async (req, res) => {
    let query = {}
    const keys = Object.keys(req.query)
    const body = req.body
    console.log('body', body);
    if(keys.length > 0) {
      query[keys[0]] = req.query[keys[0]] 
    }
    console.log('set', query);
    if(Object.keys(query) < 1) {
      throw new Error("please, provide the query")
    }
    const result = await client.updateByQuery({
      index: 'game-of-thrones',
      script: {
        lang: 'painless',
        source: 'ctx._source.character = params.character; ctx._source.quote = params.quote',
        params: body
      },
      query: {
        match: query
      }
    })
    res.status(200).json(result)
  })

router.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params
    const result = await client.get({
      index: 'game-of-thrones',
      id
    })
    res.status(200).json(result)
  })
  .delete(async (req, res) => {
    const { id } = req.params
    const result = await client.delete({
      index: 'game-of-thrones',
      id
    })
    res.status(200).json(result)
  })
  .put(async (req, res) => {
    const { id } = req.params
    const { character, quote } = req.body
    console.log(req.body);
    const result = await client.update({
      index: 'game-of-thrones',
      id,
      script: {
        source: 'ctx._source.character = params.character; ctx._source.quote = params.quote',
        lang: 'painless',
        params: {
          character,
          quote
        }
      }
      // we can update with this aswell
//      doc: {
//        character,
//        quote
//      }
    })
    res.status(200).json(result)
  })

module.exports = router
