const express = require('express')
const client = require('../elastic-client.js')

const router = express.Router()

// sort options we want to check
const sortOptions = [ 'counter' ]

router.route('/')
  .get(async(req, res) => {
    // extract sort query params from the req 
    let { sort } = req.query

    // define default counter sort,
    const defaultCounterSort = { "counter": { "order": "desc" }}
    let counterSort = defaultCounterSort

    // other default sorts
    let statusSort = {"": {"order": "" }}

    // if use provided the sort query 
    if(sort) {
      sort = JSON.parse(JSON.stringify(sort, sortOptions))
      Object.keys(sort).forEach(k => {
        if(k === 'counter' && [ 'asc', 'desc' ].indexOf(sort[k]) >=0) {
          counterSort['counter'] = { "order": sort[k] }
        }
      })
    }

    const sortArray = [ counterSort ]
    const result = await client.search({
      index: 'test',
      body: {
        sort: sortArray
      }
    })
    res.status(200).json(result)
  })
  .post(async (req, res) => {
    const body = req.body;
    const result = await client.index({
      index: 'test',
      body
    })
    res.status(201).json(result)
  })

router.route('/:id')
  .put(async (req, res) => {
    const { id } = req.params
    const { inc, tag } = req.body

    const result = await client.update({
      index: 'test',
      id,
      body: {
        script: {
          lang: 'painless',
          source: "ctx._source.remove('new_field'); ctx._source.counter += params.inc; if(ctx._source.tags.contains(params.tag)) { ctx._source.tags.remove(ctx._source.tags.indexOf(params.tag))}",
          params: {
            inc,
            tag 
          }
        }
      }
    })
    res.status(200).json(result)
  })

module.exports = router
