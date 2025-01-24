import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import userModel from '../models/user.model.js';
import redisClient from '../services/redis.service.js';

export const createUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const  user = await userService.createUser(req.body);
        const token = await user.generateToken();

        delete user._doc.password;
      
        res.status(201).json({user, token});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const {email, password} = req.body;
        const user =  await userModel.findOne({email}).select('+password');
        if (!user) {
            return res.status(404).json({error: 'Invalid email'});
        }

        const isValidPassword = await user.isValidPassword(password);
        if (!isValidPassword) {
            return res.status(404).json({error: 'Invalid password'});
        }

        const token = await user.generateToken();

        delete user._doc.password;

        res.status(200).json({user, token});

    } catch (error) {
        res.status(400).json({error: error.message});
    }
}

export const getProfileController = async (req, res) => {
    res.status(200).json(req.user);
}

export const logoutUserController = async (req, res) => {
    try{
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);
        res.status(200).json({message: 'Logout successful'});
    }
    catch(error){
        console.log(error);
        res.status(400).json({error: error.message});
    }
}

export const getAllUsersController = async (req, res) => {
    try{
        const loggedInUser = await userModel.findOne({email: req.user.email});
        const userId = loggedInUser._id;
        const allUsers = await userService.getAllUsers(userId);
        res.status(200).json(allUsers);
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error.message});
    }
}
