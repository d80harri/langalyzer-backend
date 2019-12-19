import { MongoClient } from 'mongodb';
import express from 'express';
import bodyParser from 'body-parser';
import * as uuid from 'uuid';

const app = express();
const port = process.env.PORT || 8080; // default port to listen

export class MongoHelper {
    public static client: MongoClient;

    public static connect(url: string): Promise<MongoClient> {
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

});

// define a route handler for the default home page
app.get('/', (req, res) => {
    res.send('Hello world!');
});

const clients: { entry: { id: string, uri: string }, client: MongoClient }[] = [];

app.post('/clients', async (req, res) => {
    try {
        const clientJson = req.body;
        let clientEntry = clients.find(c => c.entry.uri === clientJson.uri);

        if (!clientEntry) {
            clientJson.id = uuid.v1();
            const client = await MongoHelper.connect(clientJson.uri);
            clientEntry = { entry: clientJson, client };
            clients.push(clientEntry);
        }
        res.send(clientEntry.entry);
    } catch (e) {
        console.log('error occured', e);
        res.status(500);
    }
});

app.get('/clients', async (req, res) => {
    res.send(clients.map(c => c.entry));
});


app.post('/db/:client/:db/:collection', async (req, res) => {
    const client = clients.find(c => c.entry.id === req.params.client);
    const db = req.params.db;
    const collection = req.params.collection;
    await client.client.db(db).collection(collection).insertOne(req.body);

    return res.send(req.body);
});

app.get('/db/:client/:db/:collection', async (req, res) => {
    const client = clients.find(c => c.entry.id === req.params.client);

    if (!client) {
        res.status(400);
        res.send({ message: 'unknown client. did you forget to post a client?' });
    }

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
        const result = await client.client.db(db).collection(collection).find(query).toArray();
        res.send(result);
    } catch (e) {
        console.log('error', e);
    }
});

