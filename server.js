import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 9000;
const url = 'mongodb+srv://manzil:Po1cvym4Fvz9WBVb@cluster0.dpwwvvj.mongodb.net/?retryWrites=true&w=majority';


const pusher = new Pusher({
  appId: "1529761",
  key: "33994c01b1da80573084",
  secret: "7eb8ad57e5b641aa9a33",
  cluster: "ap2",
  useTLS: true
});


// pusher.trigger("my-channel", "my-event", {
//   message: "hello world"
// });


app.use(express.json());

app.use(cors());

mongoose.connect(url);

const db = mongoose.connection;

db.once('open',() => {
    console.log("DB is connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        
        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('message','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                received: messageDetails.received
            });
        } else {
            console.log('Error triggering pusher');
        }
    })
});

app.get('/api/v1/messages/sync',(req,res) => {
    Messages.find((err,data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
});


app.post('/api/v1/messages/new',(req,res) => {
    const message = req.body;
    Messages.create(message,(err,data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
});




app.listen(port,() => console.log(`Listening on port no. ${port}`));