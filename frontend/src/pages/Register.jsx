import React, { useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = ({ setUser }) => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
            password: '',
            role: 'patient'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/users/register', formData);
            localStorage.setItem("token", res.data.token);
            console.log(res.data);
            setUser(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4'
      style={{ backgroundImage: "url(/Smiling_Old_Couple_2.jpg)" }}
    > 
        <div className='bg-black/40 backdrop-blur-[5px] p-8 rounded-lg shadow-md w-full max-w-lg text-center'>
            <h2 className='text-2xl font-bold mb-6 text-center text-white'>
                Register
            </h2>
            {error && <p className='text-red-500 mb-4 text-sm'>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className='mb-4'>
                    <label className='block text-white text-sm font-medium mb-1'>
                        Username
                    </label>
                    <input className='w-full p-3 border border-gray-400 rounded-md focus:ring-2
                    focus:ring-pink-200 outline-none focus:border-pink-400 placeholder-white'
                    type='username'
                    name='username'
                    value={formData.username}
                    onChange={handleChange}
                    placeholder='Enter your username'
                    autoComplete='off'
                    required
                    />
                </div>
                <div className='mb-4'>
                    <label className='block text-white text-sm font-medium mb-1'>
                        Email
                    </label>
                    <input className='w-full p-3 border border-gray-400 rounded-md focus:ring-2
                    focus:ring-pink-200 outline-none focus:border-pink-400 placeholder-white'
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='Enter your email'
                    autoComplete='off'
                    required
                    />
                </div>
                <div className='mb-4'>
                    <label className='block text-white text-sm font-medium mb-1'>
                            Role
                    </label>
                    <select
                        className='w-full p-3 border border-gray-400 rounded-md focus:ring-2 focus:ring-pink-200 outline-none focus:border-pink-400 text-white'
                        name='role'
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value='doctor'>Doctor</option>
                        <option value='patient'>Patient</option>
                    </select>
                </div>
                <div className='mb-6'>
                    <label className='block text-white text-sm font-medium mb-1'>
                        Password
                    </label>
                    <input className='w-full p-3 border border-gray-400 rounded-md focus:ring-2
                    focus:ring-pink-200 outline-none focus:border-pink-400 placeholder-white'
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    placeholder='Enter your password'
                    />
                </div>
                <button className='w-full bg-[rgb(211,46,149)]/60 text-white p-3 rounded-md hover:bg-[rgb(211,46,149)]/80
                font-medium cursor-pointer'>
                    Register
                </button>
            </form>
        </div>
    </div>
  );
};

export default Register