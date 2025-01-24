import projectModel from '../models/project.model.js';
import userModel from '../models/user.model.js';
import * as projectService from '../services/project.service.js';
import { validationResult } from 'express-validator';


    export const createProject = async (req, res) => {
        const errors = validationResult(req);

        try{
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            
            const {name} = req.body;
            const loggedInUser = await userModel.findOne({email: req.user.email});
            const userId = loggedInUser._id;
            const newProject = await projectService.createProject(name, userId);
            res.status(201).json(newProject);
        } catch (error) {
            res.status(400).json({message: error.message});
        }
    }

    export const getAllProjects = async (req, res) => {
        try {
            const loggedInUser = await userModel.findOne({email: req.user.email});
            const userId = loggedInUser._id;
            const AllUsersProjects = await projectService.getAllProjectsByUserId(userId);   
            return res.status(200).json({projects: AllUsersProjects});

        } catch (error) {
            res.status(400).json({error: error.message});
        }
    }
        
    export const addUserToProject = async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        try{
            const {projectId, users} = req.body; 
            const loggedInUser = await userModel.findOne({email: req.user.email});
            const userId = loggedInUser._id;
            const updatedProject = await projectService.addUserToProject(projectId, users, userId);
            return res.status(200).json({project: updatedProject});

        } catch (error) {
            console.log(error);
            res.status(400).json({error: error.message});
        }

    }
    export const getProjectById = async (req, res) => {
        const {projectId} = req.params;
        try{
            const project = await projectService.getProjectById(projectId);
            return res.status(200).json({project});
        } catch (error) {
            console.log(error);
            res.status(400).json({error: error.message});
        }
    }
