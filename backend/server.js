import http from 'http'
import app from './app.js'
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io';
import cors from 'cors'
import mongoose from 'mongoose'
import projectModel from './models/project.model.js'
import { generateResponse } from './services/gemini.service.js'
const port = process.env.PORT || 3000



const server = http.createServer(app) 

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid project ID'));
        }

        socket.projectId = await projectModel.findById(projectId).lean();

        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error('Authentication error'));
        }


        socket.user = decoded;

        next();


    } catch (error) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', async socket => {

    socket.roomId = socket.projectId._id.toString();

    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiInMessage = message.includes('@ai');

        socket.broadcast.to(socket.roomId).emit('project-message', data);

        if (aiInMessage) {

            const prompt = message.replace('@ai', '');  

            const response = await generateResponse(prompt);

            io.to(socket.roomId).emit('project-message', { 
                sender: {
                    _id: 'ai',
                    email: 'ai'
                },
                message: response 
            });

            return ;
        }

        console.log(data);

        console.log(socket.roomId);

    });


    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId);    
    });
});



server.listen(port, () => {
    console.log(`server is running on ${port}`)
})
