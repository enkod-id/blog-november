require('dotenv').config()
const helmet = require('helmet')
const path = require('path')
const express = require('express')
const databaseMiddleware = require('./middleware/db-middleware.js')
const authRouter = require ('./routes/auth-route.js')
const blogRouter = require ('./routes/blog-route.js')
const authMiddleware = require ('./middleware/authentication-middleware.js')
const swaggerUi = require('swagger-ui-express')
const yaml = require('yaml')
const fs =  require('fs')
const openApiPath = './doc/openapi.yaml'
const OpenApiValidator = require('express-openapi-validator')
const file = fs.readFileSync(openApiPath, 'utf8')
const swaggerDocument = yaml.parse(file)
const bodyParser = require('body-parser')
const ejs = require('ejs')
const cors = require('cors');


const app = express()
app.use(cors());

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.json())

app.use(databaseMiddleware)

app.use(helmet());
app.use(helmet.frameguard( {action: 'deny'}))

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || 'Something went wrong.';
    res.status(status).json({ message: message });
  });
  

//app.use(cors(corsOptions));
// app.use(OpenApiValidator.middleware({
//     apiSpec: openApiPath,
//     validateRequest:true
// }));

app.use('blogs', () => {
    console.log('blogs')
})
app.use('/auth', authRouter)
app.use('/blog', blogRouter)
//app.use('/', blogRouter)

//crud
// app.get('/', (req, res) => {
//     res.render('index'); 
// });

app.get('/', async (req, res) => {
    try {
        const blogs = await req.db.collection('blogs').find().toArray();
        res.render('index', { data: blogs });
    } catch (error) {
        console.error(error);
        res.status(500).send('error');
    }
});




const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Running on port http://locahost:${port}`)
})
