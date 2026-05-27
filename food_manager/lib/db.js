import { MongoClient } from 'mongodb';
if(!process.env.DB_URI){
    throw new Error("Mongo URI not Found");
}

const client = new MongoClient(process.env.DB_URI);

async function getDB(dbName) {
    try{
        await client.connect()
        console.log('>>>>Connected to DB<<<<');
        return client.db(dbName);
    }
    catch (err){
        console.log(err);
    }
}

export async function getCollection(collectionName) {
    const db = await getDB('smartFridge_DB')
    if(db){
        return db.collection(collectionName);
    }

    return null;
}