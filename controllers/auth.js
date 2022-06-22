const mariadb = require('mariadb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const {createTokens} = require('./jwt');

const pool = mariadb.createPool({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

const conn = pool.getConnection();

exports.register = (req, res) => {
    const { username, email, password } = req.body

    conn.then(conn => {
        conn.query("SELECT email FROM users WHERE email = ?", [email])
            .then(async rows => {
                if (rows.length > 0) {
                    return res.render('register', {
                        message: "User with this email already exists!"
                    })
                } else {
                    let hashedPassword = await bcrypt.hash(password, 8);
                    var today = new Date();
                    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    var dateTime = date + 'T' + time;
                    conn.query("INSERT INTO users VALUES (null, ?, ?, ?, ?, ?)", [username, hashedPassword, 'user', dateTime, email])
                        .then(rows => {
                            res.redirect("/login")
                        })
                }

            })
    });
}

exports.login = (req, res) => {
    const { username, password } = req.body
    conn.then(conn => {conn.query("SELECT * FROM users WHERE username = ?", [username])
        .then(rows => {
            if(rows.length == 0) {
                res.send("User not found")
            } else {
                let user = {
                    id: rows[0].id_u,
                    username: rows[0].username,
                    password: rows[0].password,
                    role: rows[0].role
                }

                bcrypt.compare(password, user.password).then((match) => {

                    if(!match) {
                        res.status(401).json({
                            error: "Wrong username and password combination"
                        })
                    } else {
                        const accessToken = createTokens(user)
                        res.cookie("access-token", accessToken, {
                            maxAge: 60 * 15 * 1000
                        })
                        res.redirect('/')
                    }
                })
            }
        })
    })
}