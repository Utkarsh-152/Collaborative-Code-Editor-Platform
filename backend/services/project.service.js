import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';


export const createProject = async (name, userId) => {
    
    if (!name) {
        throw new Error('Name is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [userId]
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw error; 
    }
    
    return project;
}

export const getAllProjectsByUserId = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const AllUsersProjects = await projectModel.find({users: userId});
    return AllUsersProjects;
}

export const addUserToProject = async (projectId, users, userId) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid project ID');
    }
    if (!users) {
        throw new Error('Users are required');
    }
    if(!Array.isArray(users)){
        throw new Error('Users must be an array');
    } 
    if(!userId){
        throw new Error('User ID is required');
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error('Invalid user ID');
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId
    });

    if(!project){
        throw new Error('user does not have access to this project');
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: { users: { $each: users } }
    }, { new: true });

    return updatedProject;

}

export const getProjectById = async (projectId) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }
    if(!mongoose.Types.ObjectId.isValid(projectId)){
        throw new Error('Invalid project ID');
    }
    const project = await projectModel.findOne({_id: projectId}).populate('users');
    return project;
}
