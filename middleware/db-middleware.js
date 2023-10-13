const { MongoClient} = require('mongodb')

const databaseMiddleware = async (req, res, next) => {
    const mongoClient = await new MongoClient ("mongodb://mongo:a7RNywOETnFdIiEPDMrb@containers-us-west-76.railway.app:6151").connect()
    db = mongoClient.db('myproject')

    req.db = db

    next()
}

module.exports =  databaseMiddleware