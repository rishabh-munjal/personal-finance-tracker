// import mongoose from "mongoose";
import dotenv from "dotenv";
// import { MongoAWSError } from "mongodb";
import AWS from 'aws-sdk' ;
dotenv.config();

// export const connectDB = async (req, res) => {

//     const db = process.env.MONGO_URI;

//     const {connection} = await mongoose.connect(db, { useNewUrlParser: true });

//     console.log(`MongoDB Connected to ${connection.host}`);

// }

/* Configuring DynamoDB Locally  */

let docClient;

try {

    AWS.config.update({
        region : process.env.AWS_Region,
        accessKeyId : process.env.AWS_Access_Key_ID ,
        secretAccessKey :process.env.AWS_Secret_Access_Key ,
        endpoint :'http://localhost:8000'
    })
    
    docClient = new AWS.DynamoDB.DocumentClient();
    
    const test = new AWS.DynamoDB();

    test.listTables({}, (err, data) => {
        if (err) {
          console.error('DynamoDB connection failed:', {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            retryable: err.retryable
          });
        } else {
          console.log('DynamoDB Client Configured. Tables:', data.TableNames);
        }
    });
} catch (error) {
    console.log('Failed Configuring DynamoDB Client:', error.message);
}

export { docClient };


