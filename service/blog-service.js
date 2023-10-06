const { ObjectId } = require('mongodb')
const cors = require('cors')


const getIndex = async (req, res) => {
    
}    

const getAllBlog = async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    try{
        const blogs = await req.db.collection('blogs').find().toArray()

        res.status(200).json({
            message: 'Blog successfully created',
            data: blogs
        })
    }catch(error){
        res.status(400).json({ error: error.message })        
    }
}


const createBlog = async (req, res) => {
    const { title, author } = req.body

    try{
        const newBlog = await req.db.collection('blogs').insertOne({ title, author })

        res.status(200).json({
            message: 'Blog Successfully created',
            data: newBlog
        })
    }catch(error){
        res.status(400).json({ error: error.message })
    }
}

const updateBlog = async (req, res) => {
    const id = req.params
    const { title, author } = req.body

    try{
        const blog = await req.db.collection('blogs').updateOne({_id: new ObjectId(id)}, { $set: { title, author }})

        res.status(200).json({
            message: 'Blog successfully updated',
            data: blog
        })
    }catch(error){
        res.status(400).json({ error: error.message })
    }
}

const deleteBlog = async (req, res) => {
    const id = req.params
    const blog = await db.collection('blogs').deleteOne({_id: new ObjectId(id)})

    res.status(200).json({
        message: 'success',
        data: blog
    })    

}

const viewById = async (req, res) => {
    const id = req.params
    const blog = await db.collection('blogs').findOne({_id: new ObjectId(id)})
    res.status(200).json({
        message: 'success',
        data: blog
    })
}

module.exports = {
    getAllBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    viewById,
    getIndex
}