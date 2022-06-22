const express = require('express')
const mariadb = require('mariadb')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const exphbs = require('express-handlebars')
const sessions = require('express-session')
const cookieParser = require("cookie-parser")
const bcrypt = require('bcryptjs')

dotenv.config({ path: './.env' })

const app = express()
const port = 3000

const oneDay = 1000 * 60 * 60 * 24

// Connection creation for DB
const pool = mariadb.createPool({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

const conn = pool.getConnection()

const publicDirectory = path.join(__dirname, './public')

app.use(cookieParser())

app.use(sessions({
    secret: process.env.SECRET,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

app.use(cors())

app.use(express.static(publicDirectory))

app.use(express.urlencoded({ extended: false }))

app.use(express.json())

app.engine('hbs', exphbs.engine({
    defaultLayout: false,
    layoutsDir: "views/",
    helpers: {
        setDetailUrl(id) {
            return "/" + id
        },
        json(content) {
            if (!content) {
                return 0
            } else {
                return JSON.stringify(content)
            }
        }
    }
}))

app.set('view engine', 'hbs')

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Views
app.use('/', require('./routes/pages'))

//Auth
app.use('/auth', require('./routes/auth'))



// POST postOrder
app.post('/postOrder', (req, res) => {
    const products = (req.body).toString()


    conn.then(conn => {
        conn.query("INSERT INTO orders VALUES (null, ?, ?)", [products, 1])
            .then(rows => {
                req.session.cart = null
                res.json({ message: "Order created" })
            })
    })
})

// POST createOrder
app.post('/createOrder', (req, res) => {
    const productId = req.body.id
    let product

    conn.then(conn => {
        conn.query("SELECT * FROM products WHERE id_p= ?", [productId])
            .then(rows => {
                product = rows[0]
                if (!req.session.cart) {
                    req.session.cart = [product]
                } else {
                    req.session.cart.push(product)
                }
                res.json({ message: "Product Added to cart" })
            })
    })
})

// GET Products
app.get('/products', (req, res) => {
    conn.then(conn => {
        conn.query("SELECT * FROM products")
            .then(rows => {
                res.json(rows)
            })
    })
})

// GET Product By Id
app.get('/products/:id', (req, res) => {
    const productId = req.params.id
    const query = "SELECT * FROM products WHERE id_p=" + productId

    conn.then(conn => {
        conn.query(query)
            .then(rows => {
                res.json(rows);
            })
    })
})

// POST User
app.post('/users', async (req, res) => {
    const { username, email, password, role } = req.body

    let hashedPassword = await bcrypt.hash(password, 8)
    var today = new Date()
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    var dateTime = date + 'T' + time
    conn.then(conn => {
        conn.query("INSERT INTO users VALUES (null, ?, ?, ?, ?, ?)", [username, hashedPassword, role, dateTime, email])
            .then(rows => {
                res.redirect("/dashboard/users")
            })
    })
})

// POST Product
app.post('/products', (req, res) => {
    const product = req.body
    var today = new Date()
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    var dateTime = date + 'T' + time

    conn.then(conn => {
        conn.query(
            "INSERT INTO products VALUES (null, ?, ?, ?, ?, ?, ?)",
            [product.name, product.price, '4.5', product.description, dateTime, product.link]
        ).then(rows => {
            res.redirect('http://localhost:3000/dashboard/products')
        })
    })
})

// DELETE Product
app.delete('/products/:id', (req, res) => {
    const productId = req.params.id
    const query = "DELETE FROM products WHERE id_p=" + productId

    conn.then(conn => {
        conn.query(
            query
        ).then(rows => {
            res.redirect('http://localhost:3000/dashboard/products')
        })
    })
})

// DELETE user
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id

    conn.then(conn => {
        conn.query(
            "DELETE FROM users WHERE id_u=?", [userId]
        ).then(rows => {
            res.redirect('http://localhost:3000/dashboard/users')
        })
    })
})

app.listen(port, () => console.log(`App listening on port ${port}!`))