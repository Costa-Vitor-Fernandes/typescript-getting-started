import express from 'express';
import path from 'path';
import mysql from 'mysql2/promise'
const cors = require('cors')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 5000;
const app = express();
const dotenv = require('dotenv')
dotenv.config()

// git add .
// git commit -m "mensagem"
// git push heroku main
// heroku open /nome

const databaseName = "cyxq0cm76hxadtd8" //heroku
const HOST = process.env.HOST
const PASS = process.env.PASS
const USER = process.env.USER

app
  .use(express.static(path.join(__dirname, '../public')))
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

  const db = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASS,
    database: databaseName,   
    port: 3306,
    rowsAsArray: true
  })

app.use(cors())
app.use(express.json());

function verifyJWT(req:any, res:any, next:Function){ 
  if(!req.body.token){
    return res.status(500).send({ auth: false, message: 'Token inválido.' })
  }
  var token = req.body.token

  if (!token) 
      return res.status(401).send({ auth: false, message: 'Token não informado.' }); 
  
  jwt.verify(token, process.env.SECRET, function(err:string, decoded:any) { 
      if (err) 
          return res.status(500).send({ auth: false, message: 'Token inválido.' }); 
      next(); 
  }); 
}    


  

//==============================================================================================================================
// POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST POST 

//registering
app.post('/create',  async (req,res)=>{
  const password =  req.body.password
  const username = req.body.username
  const email = req.body.email    
  
try{
        const hashedPassword:string = await bcrypt.hash(password, 10);
        const insert = (await db).query(`INSERT INTO ${databaseName}.user (username, email, password) VALUES (?,?,?)`,[username, email, hashedPassword])
        console.log(await insert, 'await insert bug')
        console.log('creating user : ', username)
        return res.status(200).send(await insert)
    }
   
  catch{
      res.status(500).send('deu ruim !')
  }
})


app.post('/login', async(req,res)=>{

  const username:string = req.body.username
  const password:string = req.body.password
try{
    const result = (await db).query(`SELECT * FROM user WHERE username=?`, [username])
    const [rows] = await result
    const resultArr:Array<any> = [rows]
    const id:number = resultArr[0][0][0]
    const hashedPassword:string = resultArr[0][0][3]
    const compare = await bcrypt.compare(password, hashedPassword)
    // console.log(rows, 'rows', hashedPassword, 'password', id, 'id', await compare, 'compare')
    if(await compare){
      const token = jwt.sign({id}, process.env.SECRET, {
                    expiresIn: 43200 // expires in 12h
                    });
      res.cookie('token',token,{httpOnly:true}) 
      return res.json({ auth: true, token: token})  //JWT TOKEN RES test
    }
      return res.status(500).send("Login inválido !")
    }

  
catch{
    res.status(500).send('Alguma coisa deu ruim ai no login')
  }
})


app.post('/AdicionarCarro', verifyJWT, async (req,res)=>{
  //proteger contra duplicatas em objetos tipo unique, ex: placa
  const name:string = req.body.name
  const brand:string = req.body.brand
  const description:string = req.body.description
  const plate:string = req.body.plate
  const year:number = req.body.year
  const color:string = req.body.color
  const price:number = req.body.price
  const username:string = req.body.username

  
  try{ 
    const selectQuery = `(SELECT id_user FROM user WHERE username='${username}')`
    const result = (await db).query(`INSERT INTO carro (name, description, plate, year, color, price, brand, dono_fk) VALUES (?,?,?,?,?,?,?,${selectQuery})`,[name,description,plate,year,color,price,brand])
    // console.log([name,description,plate,year,color,price,])
    res.send(`${name} foi adicionado`)
  }
  catch{
    res.status(500).send('deu ruim')
  }
})

app.get('/todosCarros', async (req, res) =>{
interface ObjResCarro{
  id_carro:number,
  name:string,
  description:string,
  plate:string,
  year:number,
  color:string,
  price:number,
  isFav:boolean,
  brand:string,
}
  const result = (await db).query(`SELECT * FROM ${databaseName}.carro`)
  const [rows] = await result
  
  const response:Array<ObjResCarro> = []
  const destructuring:Array<any> = [rows].flat()
  destructuring.forEach((e,i,arr)=>{
    response.push({id_carro:arr[i][0], name:arr[i][2], description:arr[i][3], plate:arr[i][4], year:arr[i][5], color:arr[i][6], price:arr[i][7], brand:arr[i][9], isFav:false})
  })

  res.status(200).send(response)
})

app.delete('/deleteCarro', verifyJWT, async (req,res) =>{
  const id_carro = req.body.id_carro
  const username = req.body.username
  
interface SelectIdQuery{
  id_user:number,
  username:string
}

  const response:Array<SelectIdQuery> = []
  
const selectIdQuery = (await db).query("SELECT * FROM user WHERE username=? ",[username])
const [rows] = await selectIdQuery
const destructuring:Array<any> = [rows].flat()
destructuring.forEach((e,i,arr)=>{
  response.push({id_user:arr[i][0], username:arr[i][2]})
})
const dono_fk = response[0].id_user
const deleteQuery = (await db).query("DELETE FROM carro WHERE id_carro='?' AND dono_fk='?'", [id_carro,dono_fk])
res.status(200).send(await deleteQuery)
})
// ------------------------------------------------------------------------------------------------
// TESTING SECTION TESTING SECTION TESTING SECTION TESTING SECTION TESTING SECTION TESTING SECTION



// EVERYTHING WORKING NICELY HERE IN TESTING SECTION



app.get('/createMOCK', async (req, res) =>{
  const result = (await db).query(`SELECT * FROM ${databaseName}.mock_table`)
  res.status(200).send(await result)
})

app.post('/createMOCK', verifyJWT, async(req,res)=>{
  try{
   const dbresult = (await db).query(`INSERT ${databaseName}.mock_table (nome) VALUE (?)`,[req.body.nome])
   console.log(dbresult)
   res.status(200).send(await dbresult)
  }
  catch{
res.status(500).send('deu ruim ao inserir')
  }
})