const app = require('./app')
const { PORT, DB_URL } = require('./config')
const knex = require('knex')

//connect to db using knex
const db = knex({
  client: 'pg',
  connection: DB_URL
})

//use an Express feature (.set) to set a property on the app instance from the ./src/server.js file. 
//Using app.set('property-name', 'property-value') we can set a property called 'db' and set the Knex instance as the value
//any middleware in app can now read knex instance using (req.app.get('db'))
app.set('db', db)

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})