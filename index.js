const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// MIddle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kdtr5cm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT (req, res, next){
    // console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'Unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const serviceCollection = client.db("geniusCar").collection("services");
        const orderCollection = client.db("geniusCar").collection("orders");

        app.get('/services', async(req, res) =>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        //Orders
        app.get('/orders', verifyJWT, async(req, res) =>{
            // console.log(req.headers.authorization);
            let query = {};
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                return res.status(403).send({message: 'Forbidden access'})
            }
            console.log(decoded);
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        app.post('/orders', verifyJWT, async(req, res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        app.delete('/orders/:id', verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/orders/:id', verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const status = req.body.status
            const query = {_id: ObjectId(id)}
            const UpdatedDoc = {
                $set:{
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, UpdatedDoc);
            res.send(result);
        })

        //JWT
        app.post('/jwt', (req, res) =>{
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '100'})
            res.send({token})
        })

    }finally{

    }
}
run().catch(error => console.error(error));

app.get('/', (req, res) =>{
    res.send('Genius car server is running');
})

app.listen(port, () =>{
    console.log(`Genius car server running on ${port}`);
})
