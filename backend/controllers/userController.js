// import User from "../models/UserSchema.js";
import { docClient as User } from "../DB/Database.js";
import bcrypt, { hash } from "bcrypt";
import {v4 as uuidv4} from 'uuid';

export const registerControllers = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        // console.log(name, email, password);

        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Please enter All Fields",
            }) 
        }

        /* 
        MongoDB version
               let user = await User.findOne({email});
        */ 

        // Check if user exists
        const existingUser = await User.get({
            TableName: 'Users',
            Key: { email },
        }).promise();
        
        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User already Exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // console.log(hashedPassword);

/* MongoDB version
         let newUser = await User.create({
            name, 
            email, 
            password: hashedPassword, 
        });
 */

        const newUser = {
            userId: uuidv4(),
            name,
            email,
            password: hashedPassword,
            isAvatarImageSet: false,
            avatarImage: '',
            transactions: [],
            createdAt: new Date().toISOString(),
        };

        await User.put({
            TableName: 'Users',
            Item: newUser,
        }).promise();

        delete newUser.password;

        return res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user: newUser
        });
    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }

}

export const loginControllers = async (req, res) => {
    try{
        const { email, password } = req.body;

        // console.log(email, password);
  
        if (!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please enter All Fields",
            }); 
        }
    
/*MongoDB version         
const user = await User.findOne({ email });
 */    
        const userData = await User.get({
            TableName: 'Users',
            Key: { email },
        }).promise();

        const user = userData.Item;

        if (!user){
            return res.status(401).json({
                success: false,
                message: "User not found",
            }); 
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
    
        if (!isMatch){
            return res.status(401).json({
                success: false,
                message: "Incorrect Email or Password",
            }); 
        }

        delete user.password;

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
            user,
        });

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

export const setAvatarController = async (req, res, next)=> {
    try{

        const userId = req.params.id;
        const imageData = req.body.image;
/*MongoDB version       
        const userData = await User.findByIdAndUpdate(userId, {
            isAvatarImageSet: true,
            avatarImage: imageData,
        },
        { new: true }); */

        //Updating the user's avatar
        const params = { 
            TableName: 'Users',
            Key: { email: userId }, // Partition key
            UpdateExpression: 'set isAvatarImageSet =:isSet, avatarImage =:image',
            ExpressionAttributeValues: {
                ':isSet' : true,
                ':image' : imageData,
            },
            ReturnValues: 'ALL_NEW',
        };

        const userData = await User.update(params).promise();

        return res.status(200).json({
            isSet: userData.Attributes.isAvatarImageSet,
            image: userData.Attributes.avatarImage,
          });


    }catch(err){
        next(err);
    }
}

export const allUsers = async (req, res, next) => {
    try{
/*MongoDB version         
        const user = await User.find({_id: {$ne: req.params.id}}).select([
            "email",
            "username",
            "avatarImage",
            "_id",
        ]); */

        const userId = req.params.id;
        // Scan all users, excluding the one with the given userId
        const params =  {
            TableName: 'Users',
            FilterExpression: 'email <> :userId', // Exclude user with the given userId
            ExpressionAttrivuteValues: {
                ':userId': userId,
            },
            ProjectionExpression: 'email, username, avatarImage, email ', // Fields to retrieve
        };

        const result = await User.scan(params).promise();

        return res.json(result.Items); // It is just how the respose will be 
    }
    catch(err){
        next(err);
    }
}