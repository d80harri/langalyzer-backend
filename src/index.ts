import express from "express";

import mongoose, { Document, Schema } from "mongoose";

const app = express();
const port = process.env.PORT || 8080; // default port to listen

// define a route handler for the default home page
app.get("/", (req, res) => {
    res.send("Hello world!");
});

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});

const uri = "mongodb://root:passm3@ds353738.mlab.com:53738/heroku_mjsmh2kg";
// const uri = "mongodb+srv://root:V26iyeyt.@langalyzer-ysxsi.mongodb.net/test?retryWrites=true&w=majority";

const connect = () => {
    mongoose
        .connect(
            uri,
            { useNewUrlParser: true }
        )
        .then(() => {
            // tslint:disable-next-line: no-console
            return console.info(`Successfully connected to ${uri}`);
        })
        .catch((error) => {
            // tslint:disable-next-line: no-console
            console.error("Error connecting to database: ", error);
            return process.exit(1);
        });
};
connect();

mongoose.connection.on("disconnected", connect);

export interface ICat extends Document {
    name: string;
}

// tslint:disable-next-line: variable-name
export const CatSchema: Schema<ICat> = new Schema({ name: { type: String } });

export const Cat = mongoose.model<ICat>("Cat", CatSchema);

app.post("/api/document", async (req, res) => {
    const cat = await new Cat({
        name: req.body.name
    }).save();

    return res.send(cat);
});

app.get("/api/document", async (req, res) => {
    const result = await Cat.find().exec();
    return res.send(result);
});
