const express = require('express')
const client = require('../elastic-client.js')
const ErrorResponse = require('../utils/errorResponse.js')

const router = express.Router()

router.route('/')
  // GET /logs/_search
  // POST /logs/_search
  .get(async (req, res) => {
    const { tag, size } = req.query
    const result = await client.search({ 
      index: 'logs',
      body: {
        size: parseInt(size) || 1
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
    const partialCount = await client.count({
      index: 'logs',
      body: {
        query: {
          bool: {
            must: [
              { term: { tags: tag } }
            ]
          }
        }
      }
    })

    const data = result.hits.hits.map(hit => {
      return {
        _id: hit._id,
        _index: hit._index,
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

    res.status(200).json(response)
  })
  // POST /logs/_doc
  .post(async (req, res) => {
    const body = req.body
    
    const response = await client.index({
      index: 'logs',
      body
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
