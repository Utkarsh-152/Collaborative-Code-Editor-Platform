import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Register = () => {
  const {setUser} = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();


  function submitHandler(e) {
    e.preventDefault();
    
    // Add loading state if needed
    // setLoading(true);
    
    axios.post('/users/register', { email, password })
      .then(res => {
        console.log('Registration successful:', res.data);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/');
      })
      .catch(err => {
        // Detailed error logging
        console.error('Registration error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        // Handle specific error cases
        if (err.response?.status === 400) {
          alert(err.response.data.error || 'Invalid registration details');
        } else if (err.response?.status === 409) {
          alert('Email already exists');
        } else {
          alert('Registration failed. Please try again.');
        }
      });
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-[#252526] p-8 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.25)] border border-[#3E3E42]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-emerald-400">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={submitHandler}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-4 py-3 bg-[#2D2D2D] text-gray-300 border border-[#3E3E42] placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all duration-300"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-4 py-3 bg-[#2D2D2D] text-gray-300 border border-[#3E3E42] placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all duration-300"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 rounded-md text-white bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20"
            >
              Sign up
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;