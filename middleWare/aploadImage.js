const multer = require("multer")



const storeImage = multer.diskStorage({
    destination: (req,file,cb) =>{
        cb(null,"document")
    },
    filename: (req,file,cb)=>{
        cb(null,file.originalname)
    }
})

const uploadImage = multer({
    storage:storeImage
})

module.exports = uploadImage