const express = require('express')
const client = require('../elastic-client.js')
const ErrorResponse = require('../utils/errorResponse.js')

const router = express.Router()

router.route('/test/:id')
  .post(async (req, res) => {
    const { id } = req.params
    const  body  = req.body
    const result = await client.update({
      index: 'logs',
      id,
      body: {
        script: {
          source: 'ctx._source.name = params.name',
          params: { name: body.name }
        }
      }
    })

    res.status(200).json(result)
  })

router.route('/bucket_selector')
  .get(async (req, res) => {
    const result = await client.search({
      index: 'logs',
      size: 0,
      body: {
        aggs: {
          'names': {
            terms: { field: 'name.keyword' },
            aggs: {
              "more_count": {
                bucket_selector: {
                  buckets_path: {
                    doc_count: "_count"
                  },
                  script: "params.doc_count > 1"
                }
              }
            }
          },
        }
      }
    })
    res.status(200).json(result)
  })

router.route('/aggs')
  .get(async (req, res) => {
    const result = await client.search({
      index: 'logs',
      size: 0,
      body: {
        query: {
          term: { name: 'jake' } 
        },
        aggregations: {
          // aggregate with terms
          incidents_by_assignee: {
            terms: { field: 'name.keyword' },
            aggs: {
              documents: {
                top_hits: {}
              },
              aged: {
                filter: {
                  bool: {
                    filter: [
                      { range: { '@timestamp': { lte: 'now' } } },
                      { term: { name: 'joe'}}
                    ]
                  }
                },
                aggs: {
                  documents: {
                    top_hits: {}
                  }
                }
              },
              opened: {
                filter: { term: { name: 'jake' } },
                aggs: {
                  documents: {
                    top_hits: {}
                  }
                }
              }
            }
          }
        }
      }
    })

    const response = result.aggregations.incidents_by_assignee.buckets.map(incident => {
      let incident_documents = incident.documents.hits.hits
      let aged = incident.aged
      let opened = incident.opened
      let aged_docs = aged.documents.hits.hits
      aged = { ...aged, documents: aged_docs }
      let opened_docs = opened.documents.hits.hits
      opened = { ...opened, documents: opened_docs }
      return {
        ...incident,
        documents: incident_documents,
        aged,
        opened
      }
    })

    res.status(200).json(response)
  })

router.route('/')
  // GET /logs/_search
  // POST /logs/_search
  .get(async (req, res) => {
    const { tag, size } = req.query
    const result = await client.search({ 
      index: 'logs',
      body: {
        size: parseInt(size) || 10,
      }
    })

    // count all
    // await client.count({ index: 'logs' })
    // but the next one is flexible, and can add query
    const count = await client.count({
      index: 'logs',
      body: {
        query: {
          bool: {
            must: []
          }
        }
      }
    })

    // count with query
    const must = []
    if(tag) {
      must.push({ term: { tags: tag } })
    }
    const partialCount = await client.count({
      index: 'logs',
      body: {
        query: {
          bool: {
            must: must
          }
        }
      }
    })

    const data = result.hits.hits.map(hit => {
      return {
        _id: hit._id,
        _index: hit._index,
        name: hit._source.name,
        '@timestamp': hit._source['@timestamp'],
        message: hit._source.message,
        tags: Array.isArray(hit._source.tags) ? hit._source.tags : [ hit._source.tags ],
        lists: Array.isArray(hit._source.lists) ? hit._source.lists : [ hit._source.lists ]
      }
    })

    const response = {
      total: result.hits.total.value,
      count: count.count,
      partialCount: partialCount.count,
      data
    }

    console.log(response);
    res.status(200).json(response)
  })

  // POST /logs/_doc
  .post(async (req, res) => {
    const body = req.body
    
    const response = await client.index({
      index: 'logs',
      body: {
        '@timestamp': new Date(),
        ...body
      }
    })
    res.status(200).json(response)
  })

router.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params
    let result
    try {
      result = await client.get({
        index: 'logs',
        id
      })
    } catch (error) {
      const statusCode = error.meta.statusCode
      const message = "Record not found"
      throw new ErrorResponse({ statusCode, message })
    }
    const data = {
      _id: result._id,
      message: result._source.message,
      tags: Array.isArray(result._source.tags) 
        ? result._source.tags 
        : [ result._source.tags ],
      lists: Array.isArray(result._source.lists) 
        ? result._source.lists 
        : [ result._source.lists ]
    }
      res.status(200).json(data)
  })
  .delete(async (req, res) => {
    const { id } = req.params
    let result
    try {
      result = await client.delete({
        index: 'logs',
        id
      })
    } catch (error) {
      throw new ErrorResponse({
        statusCode: error.meta.statusCode,
        message: error.meta.body.result
      })
    }
    res.status(200).json(result)
  })

module.exports = router
