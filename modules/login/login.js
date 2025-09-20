

const mongoose = require("mongoose")
const AutoIncrement = require('mongoose-sequence')(mongoose);

const LoginSchema = mongoose.Schema({
    name:{type:String,required:true},
    Email:{type:String,required:true, unique: true},
    Password:{type:String,required:true},
    role:{type:String, enum:["admin","user"], default: "user"}
    


    

}

)



LoginSchema.plugin(AutoIncrement, { inc_field: 'Cid' });  //waa plugin lala soo dagayo oo id kuu generate gareynayo



module.exports = mongoose.model("Admin",LoginSchema)
// assignment
                                                                     
// soo design garee




