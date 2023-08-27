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

router.route('/runtime')
  .get(async (req, res) => {
    const result = await client.search({
      index: 'test',
      size: 0,
      body: {
        query: {
          match_all: {},
        },
        fields: ['counter'],
        _source: false,
        runtime_mappings: {
          counter_mttr: {
            type: 'long',
            script: {
              source: "emit(6)"
            }
          }
        },
        aggs: {
          total: {
            terms: { field: 'counter' },
          },
          aggs: {
            top_hits: {}
          }
        }
      }
    })

    res.status(200).json(result)
  })

router.route('/:id')
  .put(async (req, res) => {
    const { id } = req.params
    const { inc, tag, star , user_id} = req.body

    console.log(star, user_id);
    const result = await client.update({
      index: 'test',
      id,
      body: {
        script: {
          lang: 'painless',
          source: `
            if(ctx._source.star == null) {ctx._source.star = new ArrayList() } 
            if(params.star) {
              if(!ctx._source.star.contains(params.user_id)) { 
                ctx._source.star.add(params.user_id)
              }
            } else { 
              if(ctx._source.star.contains(params.user_id)) {
                ctx._source.star.remove(ctx._source.star.indexOf(params.user_id))
              }
            }`,
          params: {
            inc,
            tag,
            star,
            user_id
          }
        }
      }
    })
    res.status(200).json(result)
  })

module.exports = router
