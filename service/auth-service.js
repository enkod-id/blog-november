const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { JWT_SIGN } = require('../config/jwt')
const loginAttempts = {}; 
const MAX_LOGIN_ATTEMPTS = 2; 
const blockDuration = 24 * 60 * 60 * 1000; 


const getAllUser = async (req, res) => {
    try{
        const user = await req.db.collection('users').find().toArray()

        res.status(200).json({
            message: 'User successfully created',
            data: user
        })
    }catch(error){
        res.status(400).json({ error: error.message })        
    }
}

const register = async (req, res) => {
    const { username, email, password, role } = req.body

    try{
        const user = await req.db.collection('users').findOne({ username })
        if (user){
            throw new Error ('Username already exists')
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await req.db.collection('users').insertOne({ username, password: hashedPassword, email, role })
        res.status(200).json({
            message: 'User successfully registered',
            data: newUser
        }) 

        }catch (error){
       res.status(400).json({ error: error.message }) 	
    }
}

// const login = async (req, res) => {
//     const { username, password } = req.body
//     const user = await req.db.collection('users').findOne({ username })

//     const isPasswordCorrect = await bcrypt.compare(password, user.password)

//     if (isPasswordCorrect){
//         const token = jwt.sign({ username: user.username, id: user._id, role: user.role }, 'my_sign')
//         res.status(200).json({
//             message: 'User successfully logged in',
//             data: token
//         })
//     }else{
//         res.status(400).json({ error: 'Password is incorrect'})
//     }
// }

// const login = async (req, res) => {
//     const { username, password } = req.body;
//     const user = await req.db.collection('users').findOne({ username });

//     const isPasswordCorrect = await bcrypt.compare(password, user.password);

//     if (isPasswordCorrect) {
//         // Generate access token
//         const accessToken = jwt.sign({ username: user.username, id: user._id, role: user.role }, 'my_sign', { expiresIn: '15m' });

//         // Generate refresh token with a longer expiration time
//         const refreshToken = jwt.sign({ username: user.username, id: user._id, role: user.role }, 'refresh_token_secret', { expiresIn: '7d' });

//         res.status(200).json({
//             message: 'User successfully logged in',
//             accessToken,
//             refreshToken,
//         });
//     } else {
//         res.status(400).json({ error: 'Password is incorrect' });
//     }
// }
const login = async (req, res) => {
    const { username, password } = req.body;

    if (isAccountBlocked(username)) {
        return res.status(400).json({ error: 'Akun Anda telah diblokir. Silakan hubungi administrator.' });
    }

    const user = await req.db.collection('users').findOne({ username });
    if (!user) {
        return handleFailedLogin(username, res, 'Username tidak ditemukan');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
        clearLoginAttempts(username); 
        const accessToken = jwt.sign({ username: user.username, id: user._id, role: user.role }, 'my_sign', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ username: user.username, id: user._id, role: user.role }, 'refresh_token_secret', { expiresIn: '7d' });

        return res.status(200).json({
            message: 'User successfully logged in',
            accessToken,
            refreshToken,
        });
    } else {
        return handleFailedLogin(username, res, 'Password salah');
    }
}

const resetPassword = async (req, res) => {
    const { username, newPassword } = req.body;

    const user = await req.db.collection('users').findOne({ username });
    if (!user) {
        return res.status(400).json({ error: 'Username tidak ditemukan' });
    }

   

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
     await req.db.collection('users').updateOne({ username }, { $set: { password: newPasswordHash } });
    return res.status(200).json({ message: 'Password berhasil direset' });
}



const logout = (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  
    res.status(200).json({ message: 'Logout berhasil' });
  };
  

function isAccountBlocked(username) {
    return loginAttempts[username] >= MAX_LOGIN_ATTEMPTS;
}

function handleFailedLogin(username, res, errorMessage) {
    incrementLoginAttempts(username);
    if (isAccountBlocked(username)) {
        blockAccount(username);
    }
    return res.status(400).json({ error: errorMessage });
}

function incrementLoginAttempts(username) {
    if (loginAttempts[username]) {
        loginAttempts[username]++;
    } else {
        loginAttempts[username] = 1;
    }
}

function clearLoginAttempts(username) {
    delete loginAttempts[username];
}

function blockAccount(username) {
    console.log(`Akun ${username} telah diblokir.`);
    setTimeout(() => {
        clearLoginAttempts(username); 
        console.log(`Akun ${username} telah diunblock.`);
    }, blockDuration);
}

const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const decoded = jwt.verify(refreshToken, 'refresh_token_secret');
        const accessToken = jwt.sign({ username: decoded.username, id: decoded.id, role: decoded.role }, 'my_sign', { expiresIn: '15m' });

        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
}

function verifyAccessToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    try {
        const decoded = jwt.verify(token, 'my_sign');
        req.user = decoded; 
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Access token has expired' });
        } else {
            res.status(401).json({ error: 'Invalid access token' });
        }
    }
}




module.exports = {
    register,
    login,
    getAllUser,
    refreshAccessToken,
    verifyAccessToken,
    logout,
    resetPassword
}