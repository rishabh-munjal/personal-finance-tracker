// import Transaction from "../models/TransactionModel.js";
// import User from "../models/UserSchema.js";
import AWS from 'aws-sdk';
import moment from "moment";
import { docClient as Transaction } from '../DB/Database.js';


export const addTransactionController = async (req, res) => {
  try {
    const {
      title,
      amount,
      description,
      date,
      category,
      userId,
      transactionType,
    } = req.body;

    // console.log(title, amount, description, date, category, userId, transactionType);

    if (
      !title ||
      !amount ||
      !description ||
      !date ||
      !category ||
      !transactionType
    ) {
      return res.status(408).json({
        success: false,
        messages: "Please Fill all fields",
      });
    }
/*MongoDB version
    const user = await User.findById(userId);
 */
    // Retrieve the user from Dyanamo DB
    const userParams = {
      TableName: 'Users',
      Key: { userId } // Using userID as the Primary Key in the Users table
    }
    const userResult = await Transaction.get(userParams).promise();
    const User = userResult.Item;

    if (!User) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
/* MongoDB version
    let newTransaction = await Transaction.create({
      title: title,
      amount: amount,
      category: category,
      description: description,
      date: date,
      user: userId,
      transactionType: transactionType,
    });

    user.transactions.push(newTransaction);

    user.save(); */

    // Create new transaction
    const transactionId = `transaction-${Date.now()}`;  // Simple unique ID for transaction
    const transactionParams = {
      TableName: 'Transactions',
      Item: {
        userId,
        transactionId,
        title,
        amount,
        category,
        description,
        date,
        transactionType,
      }
    }; 
    
    await Transaction.put(transactionParams).promise();

    // Update user transactions
    const updateParams = {
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: 'SET transactions = list_append(transactions, :newTransaction)',
      ExpressionAttributeValues: {
        ':newTransaction': [{
          transactionId,
          title,
          amount,
          category,
          description,
          date,
          transactionType
        }],
      },
      ReturnValues: 'ALL_NEW',
    };

    await Transaction.update(updateParams).promise();   

    return res.status(200).json({
      success: true,
      message: "Transaction Added Successfully",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

export const getAllTransactionController = async (req, res) => {
  try {
    const { userId, type, frequency, startDate, endDate } = req.body;

    console.log(userId, type, frequency, startDate, endDate);

/* MongoDB version
    const user = await User.findById(userId);
 */
    const userParams = {
      TableName: 'Users',
      Key: { userId } // Using userID as the Primary Key in the Users table
    }
    const userResult = await Transaction.get(userParams).promise();
    const User = userResult.Item;

    if (!User) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

/*MongoDB version 
    // Create a query object with the user and type conditions
    const query = {
      user: userId,
    };

    if (type !== 'all') {
      query.transactionType = type;
    }

    // Add date conditions based on 'frequency' and 'custom' range
    if (frequency !== 'custom') {
      query.date = {
        $gt: moment().subtract(Number(frequency), "days").toDate()
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).toDate(),
        $lte: moment(endDate).toDate(),
      };
    }

    // console.log(query);

    const transactions = await Transaction.find(query); */

    const queryParams = {
      TableName: 'Transactions',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    if (type !== 'all') {
      queryParams.FilterExpression = 'transactionType = :type';
      queryParams.ExpressionAttributeValues[':type'] = type;
    }

    if (frequency !== 'custom') {
      queryParams.FilterExpression = (queryParams.FilterExpression || '') + ' AND date > :date';
      queryParams.ExpressionAttributeValues[':date'] = moment().subtract(Number(frequency), 'days').toISOString();
    } else if (startDate && endDate) {
      queryParams.FilterExpression = (queryParams.FilterExpression || '') + ' AND date BETWEEN :startDate AND :endDate';
      queryParams.ExpressionAttributeValues[':startDate'] = moment(startDate).toISOString();
      queryParams.ExpressionAttributeValues[':endDate'] = moment(endDate).toISOString();
    }

    const transactionsResult = await Transaction.query(queryParams).promise();


    return res.status(200).json({
      success: true,
      transactions: transactionsResult.Items,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};


export const deleteTransactionController = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.body.userId;

    // console.log(transactionId, userId);
/* MongoDB version
    const user = await User.findById(userId);
 */
    const userParams = {
      TableName: 'Users',
      Key: { userId } // Using userID as the Primary Key in the Users table
    }
    const userResult = await Transaction.get(userParams).promise();
    const User = userResult.Item;

    if (!User) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
/* MongoDB version    
    const transactionElement = await Transaction.findByIdAndDelete(
      transactionId
    ); */

    if (!transactionElement) {
      return res.status(400).json({
        success: false,
        message: "transaction not found",
      });
    }
/*MongoDB version 
    const transactionArr = user.transactions.filter(
      (transaction) => transaction._id === transactionId
    );

    user.transactions = transactionArr;

    user.save(); */

    // await transactionElement.remove();

    // Delete the transaction
    const deleteParams = {
      TableName: 'Transactions',
      Key: {
        userId,
        transactionId,  // This should match the partition and sort key for your Transactions table
      },
    };
    await Transaction.delete(deleteParams).promise();

    // Optionally, you can remove the transaction from the user's list as well (if it's stored separately)
    // Update user (remove transaction from transactions list)
    const updateParams = {
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: 'REMOVE transactions[:index]',
      ExpressionAttributeValues: {
        ':index': transactionId,  // Assuming you have the transactionId in the user's transactions list
      },
    };
    await Transaction.update(updateParams).promise();


    return res.status(200).json({
      success: true,
      message: `Transaction successfully deleted`,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};

export const updateTransactionController = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const { title, amount, description, date, category, transactionType } =
      req.body;

      if (!transactionId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID and User ID are required",
        });
      }
    // console.log(title, amount, description, date, category, transactionType);
/* MongoDB version
    const transactionElement = await Transaction.findById(transactionId);

    if (!transactionElement) {
      return res.status(400).json({
        success: false,
        message: "transaction not found",
      });
    }

    if (title) {
      transactionElement.title = title;
    }

    if (description) {
      transactionElement.description = description;
    }

    if (amount) {
      transactionElement.amount = amount;
    }

    if (category) {
      transactionElement.category = category;
    }
    if (transactionType) {
      transactionElement.transactionType = transactionType;
    }

    if (date) {
      transactionElement.date = date;
    }

    await transactionElement.save();

    // await transactionElement.remove();
 */

    const updateParams = {
      TableName: "Transaction",
      Key: {
        userId,
        transactionId,
      },
      UpdateExpression: `
        SET title = :title,
            amount = :amount,
            category = :category,
            description = :description,
            transactionType = :transactionType,
            date = :date
      `,
      ExpressionAttributeValues: {
        ':title': title,
        ':amount': amount,
        ':category': category,
        ':description': description,
        ':transactionType': transactionType,
        ':date': date,
      },
      ReturnValues: 'ALL_NEW',
    };

    const updated = await Transaction.update(updateParams).promise();

    return res.status(200).json({
      success: true,
      message: "Transaction Updated Successfully",
      transaction: updated.Attributes, //  Return the updated transaction
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      messages: err.message,
    });
  }
};
