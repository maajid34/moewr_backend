const customerModel = require("../../modules/login/login")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")


const createAdmin = async (req,res) =>{
    try {

        const {name,Email,Password} = req.body

        const ExistEmail = await customerModel.findOne({Email})

        if(ExistEmail){
            res.status(400).json({message:"exist Email"})
        }

        // hash password
        const hashPassword = await bcryptjs.hash(Password, 10)
        const newData = new customerModel({
       
      name, Email,Password: hashPassword
    })
        await newData.save()
        res.send(newData)
    } catch (error) {
        console.error(error);
        res.status(400).json({message: "server error"})
    }
    


}

const AminLogin = async(req,res) =>{
    try {
        const{Email,Password} = req.body

        // check email
         
        const checkEmail = await customerModel.findOne({Email})

        if(!checkEmail){
          return   res.status(500).json({message:"inavlid Email"})
        }

        // check password
        const checkPassword = await bcryptjs.compare(Password,checkEmail.Password)
        if(!checkPassword){
           return res.status(500).json({message:"inavlid Password"})
        }


        const token = jwt.sign(
            {id: checkEmail._id, name: checkEmail.name, Email: checkEmail.Email, role: checkEmail.role},
        process.env.JWT_Secret,
        {expiresIn: "40s"}
        )


        res.send({
            message: "Success login",
            Admin:{
                name: checkEmail.name,
                Email: checkEmail.Email,
                role: checkEmail.role
               
               
            },
            token
        })
        
    } catch (error) {
         console.error(error);
        res.status(400).json({message: "server error"})
    }
}

module.exports ={createAdmin ,AminLogin}