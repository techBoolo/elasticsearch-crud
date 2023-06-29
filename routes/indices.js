const express = require('express')
const client = require('../elastic-client.js')

const router = express.Router()

router.route('/')
  .get(async (req, res) => {
    // { format: 'json' }, 'query parameters' options, see the doc js driver for
    // _cat.indices()
    const result = await client.cat.indices({ format: 'json' })

    res.status(200).json(result)
  })
  .post(async (req, res) => {
    const { index } = req.body
    const result = await client.indices.create({
      index 
    })
    res.status(201).json(result)
  })

router.route('/:index')
  .get(async (req, res) => {
    const { index } = req.params

    const result = await client.indices.get({
      index
    })
    res.status(200).json(result)
  })
  .delete(async (req, res) => {
    const { index } = req.params
    const result = await client.indices.delete({
      index
    })
    res.status(200).json(result)
  })

module.exports = router
