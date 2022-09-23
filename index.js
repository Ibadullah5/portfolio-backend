import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import bodyParser  from 'body-parser';
import jwt from 'jsonwebtoken';

const uri = "mongodb://0.0.0.0:27017"
const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
  res.send("Hello")
})



app.post('/signup', async (req, res) =>{
  console.log(req.body)
  const client = new MongoClient(uri);
  const { email, pass } = req.body;
  const query = {email: email}
  try{
  const database = client.db('portfolio')
  const users = database.collection('users') 
  const existingUser = await users.findOne({  "email":email })
  if(existingUser){
    return res.status(409).send("User Already Exist, Please Sign In")
  }
  const newUser = {
    email: email,
    password: pass
  }
  await users.insertOne(newUser)
  jwt.sign({query}, 'secretkey', (err, token) =>{
    res.status(201).json({token, newUser})
  })
  }catch(err){
  console.log(err)
}}
)

app.post('/user',authenticateToken, async (req, res) =>{
  console.log(req.body.username)
  const formData = req.body
  const username = req.user
  const client = new MongoClient(uri);
  const query = {email: username}
  console.log(username)
  try{
    const database = client.db('portfolio')
    const users = database.collection('users') 
    const updatedDocument = {
      $set: {
        first_name: formData.firstName,
        age: formData.age,
        job: formData.job,
        birthplace: formData.birthPlace,
        image:formData.image,
        insta: formData.insta,
        linkdin: formData.linkdin,
        github: formData.github,
        about_me: formData.about_me,
        experience: formData.experience,
        qualification: formData.qualification

      }
      }
     const insertedUser = await users.updateOne(query, updatedDocument)
     res.send(insertedUser)
  }finally{
    client.close()
  }
  })

app.get('/get-user',authenticateToken, async (req, res) =>{
  const username = req.user
  const client = new MongoClient(uri);
  const query = {email: username}
  try{
    const database = client.db('portfolio')
    const users = database.collection('users') 
    const ourUser = await users.findOne(query)
    console.log('username' + username)
    res.json(ourUser)
  }finally{
    client.close()
  }
})

app.post('/login', async (req, res) =>{
  const client = new MongoClient(uri);
  const { email, pass } = req.body
  const query = { email: email }
  try{
  const database = client.db('portfolio')
  const users = database.collection('users')
  const ourUser = await users.findOne(query)
  console.log(ourUser)
  jwt.sign({query}, 'secretkey', (err, token) =>{
    res.json({token, ourUser})
  })
  }finally{
    client.close()
  }
})

app.get('/search', async(req, res) =>{
  console.log(req.query.username)
  const client = new MongoClient(uri);
  try{
    const database = client.db('portfolio');
    const users = database.collection('users');
    const myUser = await users.findOne({first_name: req.query.username})
    console.log(myUser)
    res.json(myUser)
  }finally{
    client.close();
  }
})

app.get('/get-usernames', async(req, res) =>{
  const client = new MongoClient(uri);
  try{
    const database = client.db('portfolio');
    const users = database.collection('users')
    const userNames = await users.find({}).project({first_name:1}).toArray()
    res.json(userNames)
  }finally{
    client.close()
  }
})

app.post('/change-password', authenticateToken,async (req, res) =>{
  const newPassword = req.body.newPass;
  const previousPassword = req.body.prevPass;
  const query = {'email':req.user};
  console.log(newPassword)
  console.log('req pass' + previousPassword)
  const client = new MongoClient(uri);
  try{
    const database = client.db('portfolio');
    const users = database.collection('users')
    const myUser = await users.findOne({'email':req.user});
    const myUserPassword = myUser.password
    console.log(myUserPassword)
    const updatedDocument = {
      $set:{
      'password' : newPassword
      }
    }
    if(previousPassword === myUserPassword){
      console.log('authenticated')
     await users.updateOne(query, updatedDocument)
      res.status(200)
      console.log('Password Changed')
    }else{
      res.status(401)
      console.log('Password Not Matched')
    }
  }
  finally{
    client.close()
  }
})

function authenticateToken(req, res, next){
  console.log(('ye' + ' ' + req.headers.authorization));
  const token = req.headers.authorization
  if(token === undefined) {return res.status(401)}
  jwt.verify(token, 'secretkey', (err, user) =>{
    if(err) return res.status(403)
    req.user = user.query.email;
  })
  next()
}

app.listen(5000, () => {
  console.log("Server is listening on port  5000")
})