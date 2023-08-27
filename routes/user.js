const express = require('express')
const Client = require('../elastic-client.js')

const random = (source) => source[Math.floor(Math.random() * source.length)]
const router = express.Router()

const roles = [ 'Manager', 'Operator', 'Admin', 'Executive' ]
const statuses = [ 'Backlog', 'InProgress', 'Completed' ]
const mttr_values = [ 1, 2, 3, 5, 7, 14, 17, 20, 25, 30 ]
const ticket_created_date = new Date()


const mttr_end_date = (date) => {
  let created_date = new Date(date)
  created_date.setDate(created_date.getDate() + mttr_values[Math.floor(Math.random()*mttr_values.length)])
  return created_date
}

const ticket = () =>  { return  { ticket_created_date , mttr_end_date: mttr_end_date(ticket_created_date)  } }

const risks_list = [
  { risk: 1, risk_class: 'Low'},
  { risk: 5, risk_class: 'Medium' },
  { risk: 10, risk_class: 'High' }
]

router.route('/test/:id')
  .patch(async (req, res) => {
    const { id } = req.params
    const { count, star, incident_name, ...rest } = req.body
    console.log('id', id);
    console.log('body', rest);
    const response = await Client.updateByQuery({
      index: 'user',
      body: {
        query: { 
          term: {
            _id: id
          }
        },
        script: {
          source: `
            if(ctx._source.track == null) { ctx._source.track = new ArrayList()}
            if(ctx._source.star == null) { ctx._source.star = new String()}

            if(params.star == null) {
              return
            } else {
              if(params.star == true) {
                if(ctx._source.star == null) { ctx._source.star = new String()}
                if(ctx._source.track.contains(params.count)) {
                  return 
                } else {
                  ctx._source.track.add(params.count)
                }
              } else if(params.star == false && ctx._source.track.contains(params.count)) {
                 ctx._source.track.remove(ctx._source.track.indexOf(params.count))
              }
            }

            if(params.incident_name != null) {
              if(ctx._source.incident_name == null) { ctx._source.track = new String()}
              ctx._source.incident_name = params.incident_name
            }
          `,
          params: {
            count,
            star,
            incident_name
          }
        }
      }
    })

    res.status(200).json(response)
  })

router.route('/runtime-map')
  .get(async (req, res) => {
    const response = await Client.search({
      index: 'user',
      body: {
        query: { 
          match: {
            risk_class: {
              query: "Low|Medium|High"
            }
          }
        },
        runtime_mappings: {
          'mttr_second': {
            type: 'long',
            script: {
              source: `
                emit(doc['incident.mttr_end_date'].value.toEpochSecond() - doc['incident.ticket_created_date'].value.toEpochSecond()) 
              `
            }
          },
          'incident.type': {
            type: 'keyword',
            script: {
              source: `
                if(params._source['risk_class'].startsWith('H') || params._source['risk_class'].startsWith('M')) { 
                  emit('File') 
                } else if(params._source['risk_class'].startsWith('Lo')) { 
                  emit('Net') 
                }
              `,
            }
          },
          double_risk: {
            type: 'double',
            script: {
              source: "emit(params._source['risk'] * 2.2)"
            }
          },
          risk_double: {
            type: 'long',
            script: {
              source: "emit(doc['risk'].value * 2)"
            }
          }
        },
        fields: ['incident.type', 'double_risk', 'risk_double', 'mttr_second' ],
        aggregations: {
          agg_type: {
            terms: {
              field: 'incident.type'
            },
            aggs: {
              severity: {
                terms: {
                  field: 'risk_class.keyword'
                }
              }
            }
          }
        }
      }
    })
    res.status(200).json(response)
  })

router.route('/search')
  .get(async (req, res) => {
    const response = await Client.search({
      index: 'user',
      body: {
        query: {
          terms_set: { 
            email:  {
              terms: [ 'will', 'email.com' ],
              minimum_should_match_script: {
                source: '2'
              }
            }
          }
        }
      }
    })
    res.status(200).json(response.hits.hits)
  })

router.route('/count')
  .get(async (req, res) => {
    const doc_count = await Client.count({
      index: 'user',
      body: {
        query: {
          term: {
            'role': 'operator'
          }
        }
      }
    })
    res.status(200).json(doc_count)
  })

router.route('/')
  .post(async (req, res, next) => {
    const { name, email } = req.body
    const response = await Client.index({
      index: 'user',
      body: {
        name,
        email,
        created_at: new Date()
      }
    })
    res.status(201).json(response)
  })
  .get(async (req, res)  => {
    const response = await Client.search({
      index: 'user'
    })
    res.status(200).json(response.hits.hits)
  })
  .patch(async (req, res) => {
    const result = await Client.search({
      index: 'user'
    })
    const docs = result.hits.hits
    docs.map(async(doc) => {
      const risks = { ...random(risks_list) }
      const users = [ 
        { id: 1, name: 'joe', ticket_status: random(statuses), ...ticket() }, 
        { id: 2, name: 'will', ticket_status: random(statuses), ...ticket() }, 
        { id: 3, name: 'jack', ticket_status: random(statuses), ...ticket() },
        { id: 4, name: 'sam', ticket_status: random(statuses), ...ticket() } 
      ]
      const response = await Client.update({
        index: 'user',
        id: doc._id,
        body: {
          script: {
            lang: 'painless',
            source: `
               ctx._source.role = params.roles[${Math.floor(Math.random()*(roles.length))}];
               ctx._source.incident = params.users[${Math.floor(Math.random()*(users.length))}];
               ctx._source.risk = params.risks.risk; 
               ctx._source.risk_class = params.risks.risk_class;
            `,
            params: {
              roles,    // const roles = ['User', 'Admin' ],
              users,
              risks
            }
          },
          upsert: {
          
          }
        }
      })
    })

    res.status(200).json({ message: 'under con' })
  })

router.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params

    const response = await Client.get({
      index: 'user',
      id
    })
    res.status(200).json(response)
  })
  .delete(async (req, res) => {
    const { id } = req.params

    const response = await Client.delete({
      index: 'user',
      id
    })
    res.status(200).json(response)
  })
  .put(async (req, res) => {
    const { id } = req.params
    const body = req.body
  
    const response = await Client.update({
      index: 'user',
      id,
      body: {
        doc:  body
      }
    })

    res.status(200).json(response)
  })

module.exports = router
