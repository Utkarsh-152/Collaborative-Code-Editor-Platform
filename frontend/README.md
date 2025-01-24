# Collaborative Code Editor Platform

A real-time collaborative development environment that allows multiple users to code together, chat, and get AI assistance.

## Features

### 🤝 Real-time Collaboration
- Multi-user code editing with live updates
- Project-based collaboration system
- Add collaborators to projects easily
- View active project members

### 💻 Code Editor
- Syntax highlighting for multiple languages
- File tree navigation
- Multiple file support
- Live preview capability

### 💬 Communication
- Real-time chat system
- Markdown support in messages
- Code block formatting in chat
- AI assistant integration (@ai command)

### 🔒 Authentication
- Secure user registration and login
- JWT-based authentication
- Redis-backed token management

### 🛠️ Technical Stack

**Frontend:**
- React with Vite
- Tailwind CSS for styling
- Socket.IO client for real-time features
- WebContainer API for code execution
- Highlight.js for syntax highlighting

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- Redis for session management
- Google's Generative AI for AI assistance

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- Redis
- Google AI API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

3. Set up environment variables:

```bash
# Backend .env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
GOOGLE_AI_API_KEY=your_google_ai_key

# Frontend .env
VITE_API_URL=your_backend_url
```

4. Start the development servers:

```bash
# Backend
npm start

# Frontend
npm run dev
```

## Architecture

The application follows a microservices architecture with:
- Real-time collaboration service using Socket.IO
- Authentication service with JWT and Redis
- File management service with WebContainer
- AI assistance service using Google's Generative AI

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.
