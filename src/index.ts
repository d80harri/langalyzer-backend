import express from 'express';

import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 8080; // default port to listen

const uri = 'mongodb://root:passm3@ds353738.mlab.com:53738/heroku_mjsmh2kg';

export class MongoHelper {
    public static client: MongoClient;

    public static connect(url: string): Promise<any> {
        console.log('connection3');
        return new Promise<any>((resolve, reject) => {
            console.log('connection2');
            MongoClient.connect(url, { useNewUrlParser: true }, (err, client: MongoClient) => {
                console.log('connection');
                if (err) {
                    console.log('error', err);
                    reject(err);
                } else {
                    console.log('client', client);
                    MongoHelper.client = client;
                    resolve(client);
                }
            });
        });
    }

    public disconnect(): void {
        MongoHelper.client.close();
    }
}

app.use(bodyParser.json());

// start the Express server
app.listen(port, async () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
    try {
        await MongoHelper.connect(uri);
    } catch (e) {
        console.log('error occured', e);
    }
});

// define a route handler for the default home page
app.get('/', (req, res) => {
    res.send('Hello world!');
});



app.post('/:db/:collection', async (req, res) => {
    const db = req.params.db;
    const collection = req.params.collection;
    const saveResult = await MongoHelper.client.db(db).collection(collection).insertOne(req.body);

    return res.send(req.body);
});

app.get('/:db/:collection', async (req, res) => {
    const db = req.params.db;
    const collection = req.params.collection;
    let query = {};
    if (req.query.query) {
        try {
            query = JSON.parse(req.query.query);
        } catch (e) {
            res.status(400);
            res.send({
                message: 'query is not valid ' + req.query.query,
                exception: e
            });
        }
    }

    try {
        const result = await MongoHelper.client.db(db).collection(collection).find(query).toArray();
        res.send(result);
    } catch (e) {
        console.log('error', e);
    }
});

