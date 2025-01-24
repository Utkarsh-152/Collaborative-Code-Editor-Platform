import React, { useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import { useContext } from 'react'
import axiosInstance from '../config/axios'
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const {user} = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projects, setProjects] = useState([]);

  const navigate = useNavigate();

  function createProject() {
    axiosInstance.post('/projects/create', {name: projectName})
      .then((res) => {
        console.log(res);
        // Refresh the projects list after successful creation
        axiosInstance.get('/projects/all')
          .then((res) => {
            setProjects(res.data.projects);
          })
          .catch((err) => {
            console.log(err);
          });
        setIsModalOpen(false);
        setProjectName('');
      })
      .catch((err) => {
        console.log(err);
        // Add error handling here
        alert(err.response?.data?.message || 'Failed to create project');
      });
    }

  useEffect(() => {
    axiosInstance.get('/projects/all')
    .then((res) => {
      console.log(res.data.projects);
      setProjects(res.data.projects);
    })
    .catch((err) => {
      console.log(err);
    })  
  }, []); 

  return (
    <main className='p-4'>
      <div className='projects flex flex-wrap gap-2'>
        <button 
          onClick={() => setIsModalOpen(true)}
          className='project shadow-md flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors'
        >
          <h2>Create Project</h2>
          <i className="ri-add-line"></i>
        </button>

        {projects.map((project) => (
          <div className='project flex items-center shadow-md gap-2 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer'
            onClick={() => navigate(`/project`, {state: {project}})}
            key={project._id}>
            <h2 className='text-sm font-semibold'>{project.name}</h2>
            <h2 className='text-xs text-slate-500'>{project.users.length} <i className="ri-user-fill"></i></h2>
          </div>
        ))}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Project</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              createProject();
            }}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home