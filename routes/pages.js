const express = require('express')
const router = express.Router()
const mariadb = require('mariadb')
const { validateToken } = require('../controllers/jwt')
const dotenv = require('dotenv')
dotenv.config({ path: './.env' })

const pool = mariadb.createPool({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

const conn = pool.getConnection()

router.get('/', (req, res) => {
    let products

    let loggedIn
    if (req.cookies['access-token']) {
        loggedIn = true
    } else {
        loggedIn = false
    }

    conn.then(conn => {
        conn.query("SELECT * FROM products")
            .then(rows => {
                products = rows
                res.render('index', {
                    productData: products,
                    authStatus: loggedIn
                })
            })
    })
})

router.get('/cart', validateToken(), (req, res) => {
    res.render('cart', {
        productData: req.session.cart
    })
})

router.get('/dashboard', validateToken("moderator"), (req, res) => {
    res.render('dashboard')
})

router.get('/dashboard/orders', validateToken("moderator"), (req, res) => {
    let orders

    conn.then(conn => {
        conn.query("SELECT * FROM orders")
            .then(rows => {
                orders = rows
                res.render('dashboardOrders', {
                    orderData: orders
                })
            })
    })
})

router.get('/dashboard/products', validateToken("moderator"), (req, res) => {
    let products

    conn.then(conn => {
        conn.query("SELECT * FROM products")
            .then(rows => {
                products = rows
                res.render('dashboardProducts', {
                    productData: products
                })
            })
    })
})

router.get('/dashboard/users', validateToken("admin"), (req, res) => {
    let users

    conn.then(conn => {
        conn.query("SELECT * FROM users")
            .then(rows => {
                users = rows
                res.render('dashboardUsers', {
                    userData: users
                })
            })
    })
})

router.get('/register', (req, res) => {
    let loggedIn
    if (req.cookies['access-token']) {
        loggedIn = true
    } else {
        loggedIn = false
    }

    res.render('register', {
        authStatus: loggedIn
    })
})

router.get('/login', (req, res) => {
    let loggedIn
    if (req.cookies['access-token']) {
        loggedIn = true
    } else {
        loggedIn = false
    }

    res.render('login', {
        authStatus: loggedIn
    })
})

router.get('/logout', validateToken(), (req, res) => {
    req.session.destroy()
    res.clearCookie("access-token")
    res.render('login')
})

router.get('/:id', (req, res) => {
    const productId = req.params.id

    let loggedIn
    if (req.cookies['access-token']) {
        loggedIn = true
    } else {
        loggedIn = false
    }

    conn.then(conn => {
        conn.query("SELECT * FROM products WHERE id_p= ?", [productId])
            .then(rows => {
                product = rows[0]

                if(product == undefined) {
                    res.redirect("/");
                }
                
                res.render('details', {
                    productData: product,
                    authStatus: loggedIn
                })
            })
    })
})

module.exports = router