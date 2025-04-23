# 🛠 Migrating from MongoDB (Mongoose) to AWS DynamoDB in a MERN Stack App

This guide documents the steps and decisions I took while migrating my MERN backend from **MongoDB with Mongoose** to **AWS DynamoDB**. It's intended to help others understand the transition, especially around differences in **schemas, controllers, configuration, and query logic**.

---

## ⚙️ Local Development with Fake Credentials

When using **DynamoDB Local**, AWS credentials are not required. Still, the SDK expects them:

```bash
AWS Access Key ID: "MyKeyId"
AWS Secret Access Key: "SecretAccessKey"
Default Region Name: "RegionName"
```

These can be placeholders for local testing.

---

## 📦 Installing the AWS SDK

```bash
npm install aws-sdk
```

---

### 🤩 1. Difference in Data Modeling

#### 📄 MongoDB with Mongoose

We define **schemas** using Mongoose like this:

```js
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  createdAt: Date,
});
```

#### ⚙️ DynamoDB

But in DynamoDB, **we don’t define schemas in code**.

##### 📌 Why No Schema File in DynamoDB?
- **DynamoDB is schemaless** except for the **primary key** (partition + optional sort key).
- You can store any structure per item; no need to predefine fields.
- This flexibility eliminates the need for a separate schema file like in Mongoose.

---

### 🔐 2. DynamoDB Configuration File

`db_config.js`:

```js
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION_NAME,
});

export const docClient = new AWS.DynamoDB.DocumentClient();
```

---

### 🔄 3. Updating Controllers

#### ✅ Old MongoDB (registerController.js):

```js
const user = await User.findOne({ email });
if(user) return res.status(409).json({ message: "User exists" });

const newUser = await User.create({ name, email, password });
```

#### 🔁 New DynamoDB:

```js
const { docClient } = require("../db_config.js");

const existingUser = await docClient.get({
  TableName: 'Users',
  Key: { email },
}).promise();

if(existingUser.Item) return res.status(409).json({ message: "User exists" });

await docClient.put({
  TableName: 'Users',
  Item: {
    userId: uuidv4(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  }
}).promise();
```

---

### 🚪 4. Login Flow Changes

#### ✅ Mongoose:

```js
const user = await User.findOne({ email });
const isMatch = await bcrypt.compare(password, user.password);
```

#### 🔁 DynamoDB:

```js
const result = await docClient.get({
  TableName: 'Users',
  Key: { email },
}).promise();

const user = result.Item;
if (!user) return res.status(401).json({ message: "User not found" });

const isMatch = await bcrypt.compare(password, user.password);
```

---

### ❌ Why Delete `user.password` in Response?

Before sending user data back:

```js
delete user.password;
```

#### ✅ Reason:
Even if hashed, passwords are sensitive and **should never be sent to the frontend**.

Safer option: sanitize the response before sending or manually pick fields.

---

### 📬 DynamoDB Response Structure: Why `.Item`

DynamoDB responses are wrapped:

```js
{
  Item: {
    email: "user@example.com",
    name: "John Doe",
    password: "hashedpassword"
  }
}
```

So, to access the data:

```js
const user = userData.Item;
```

Not:

```js
const user = userData;
```

---

### 🔁 Migration: MongoDB to DynamoDB Controllers

To transition the MongoDB-based controller to DynamoDB, the main adjustments will be:

1. **Change the TableName and Key Configuration:**
   - You'll need to use DynamoDB's `docClient` for performing operations. Instead of the `User` model, you’ll query DynamoDB for the user using the `userId`.
   - For transactions, instead of saving with `Transaction.create`, you’ll use `docClient.put` for inserting data into the Transactions table.

2. **Schema Adjustments:**
   - Since you’re using `userId` as the partition key in the `Transactions` table, make sure to include `userId` and `transactionId` as part of the request to store the transaction correctly.

3. **Queries:**
   - Replace MongoDB-specific queries like `User.findById` and `Transaction.find` with DynamoDB's `docClient.get` for retrieving users and `docClient.query` for retrieving transactions. DynamoDB doesn't support complex queries like MongoDB, so you'll need to structure the query with the appropriate conditions.

#### Key Differences:
- **Document Structure**: DynamoDB requires setting up a primary key for efficient querying, often combining a partition key (`userId`) and a sort key (`transactionId`) for transactions.
- **Query and Update Patterns**: MongoDB's flexible query capabilities (like `findById`) are replaced with more specific query operations (`get`, `query`, `update`, `delete`) in DynamoDB.

---

### ✅ Summary Table

| Feature                | MongoDB (Mongoose)           | DynamoDB                        |
|------------------------|-------------------------------|----------------------------------|
| Schema Definition      | Yes (`.schema.js`)            | No (schemaless)                  |
| Primary Key            | `_id`                         | Must define manually             |
| Query Capabilities     | Rich and flexible             | Basic unless using indexes       |
| Local Dev Support      | Yes                           | Yes (DynamoDB Local)             |
| SDK                    | `mongoose`                    | `aws-sdk`                        |

---

### 🚀 Wrap-Up

Migrating to DynamoDB simplifies backend ops and enables full AWS-native architecture. With the flexibility of a schemaless database and support for serverless patterns, your MERN app can now scale with zero hassle.

---

📌 For any improvements or suggestions to this guide, feel free to fork or raise an issue!

