const {sign, verify} = require('jsonwebtoken')
const dotenv = require('dotenv');

dotenv.config({ path: './.env' })

const createTokens = (user) => {
    const accessToken = sign({
        username: user.username,
        role: user.role,
        id: user.id
    }, process.env.SECRET);

    return accessToken;
}

const validateToken = (accessRoles) => {
    return (req, res, next) => {
        let accessToken;

        try{
            accessToken = req.cookies["access-token"]
            if(!accessToken) {
                res.redirect('/login')
            }
        } catch(err) {
            res.redirect('/login')
        }

        try{
            const validToken = verify(accessToken, process.env.SECRET)
            if(validToken) {
                
                if(!accessRoles) {
                    req.authenticated = true
                    next()
                }
                else if(accessRoles.includes(validToken.role) || validToken.role == "admin") {
                    req.authenticated = true
                    next()
                } else {
                    res.redirect('/')
                }
            }
        } catch(err) {
            
        }
    }
}

module.exports = {createTokens, validateToken}