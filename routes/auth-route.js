const { Router } = require('express')
const { register, login, getAllUser, logout, resetPassword} = require('../service/auth-service.js')

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout', logout)
authRouter.get('/users', getAllUser)
authRouter.get('/reset', resetPassword)


module.exports = authRouter