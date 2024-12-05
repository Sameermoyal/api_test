const express = require('express');
const mongoose = require('mongoose');
const os =require('os')
const  jwt =require('jsonwebtoken')
const bcrypt =require('bcrypt')
const secret_key='jhbvvvvvvvvvvdcc ygvuubb bbj'
const PORT = 3000;


const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/test')
.then(()=>console.log("mongodb is connected"))
.catch(()=>console.log('error in connecting mongodb'))





const userSchema =new mongoose.Schema(
  {
    email:{
      type:String,
      required:true
    },
    password:{
      type:String,
       unique:true
    }
  }
)

const CountSchema =new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',

  },
  loginCount:{
    type:Number,
     default:0
  }
})

const User = mongoose.model('user', userSchema);
const LoginCount = mongoose.model('LoginCount',CountSchema)



app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
    const salt =bcrypt.genSaltSync(10)
    const hashPassword =bcrypt.hashSync(password,salt)
    const newUser = new User({ email, password:hashPassword });
      console.log(">> newUser._id >>>", newUser._id )
      await newUser.save();
      
     const loginUser =new LoginCount({user:newUser._id}).save()
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const dbPassword =user.password
      const match =await bcrypt.compare(password,dbPassword)
       console.log(">>>>>>>>>>>match>>>>",match)
      if (!match) {
        return res.status(400).json({ message: 'wrong password' });
      }

    const loginCount = await LoginCount.findOne({ user: user._id });
    loginCount.loginCount += 1;
    await loginCount.save();

  const ip=req.headers['x-forwarded-for'] || 
          req.connection.remoteAddress ||
          req.socket.remoteAddress || 
          req.connection.socket.remoteAddress;
          console.log(">>>>>>>>>ip>>>>",ip)

    const token=jwt.sign({id:user._id},secret_key,{expiresIn:'1h'})
      res.status(200).json({ message: 'Login successful', loginCount: loginCount.loginCount,token :token });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

  app.get('/users',async(req,res,next)=>{
    try{
      const users=await LoginCount.find().populate('user');
        if(!users){
          res.status(500).json({ message: 'no users found' });
        }
        res.status(200).json(users)
    }catch(err){
      res.status(500).json({ message: 'Server error', error: error.message });
    
    }
  })


  const getSystemName = ()=>{
    const data =os.hostname();
    console.log('>>>>>>>system-data>>>',data)
    return data;
  }

 getSystemName()



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});