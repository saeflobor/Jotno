import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "patient",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/login", formData);
      const token = res.data.token;
      localStorage.setItem("token", token);

      // Immediately refetch full profile (including family) so dashboard renders correct counts without a page refresh.
      const profileRes = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(profileRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-white bg-center bg-no-repeat p-4'
    > 
        <div className='bg-white p-8 rounded-lg shadow-[0px_0px_40px_rgba(211,46,149,1)] w-full max-w-lg text-center'>
            <h2 className='text-2xl font-bold mb-6 text-center text-black'>
                Login
            </h2>
            {error && <p className='text-red-500 mb-4 text-sm'>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                        <label className='block text-black text-sm font-medium mb-1'>
                            Email
                        </label>
                        <input className='w-full p-3 border border-black rounded-md focus:ring-2
                        focus:ring-pink-200 outline-none focus:border-pink-400 placeholder-black/50 text-black'
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='Enter email'
                        autoComplete='off'
                        required
                        />
                    </div>
                    <div>
                        <label className='block text-black text-sm font-medium mb-1'>
                                Role
                        </label>
                        <select
                            className='w-full p-3 border border-black rounded-md focus:ring-2
                        focus:ring-pink-200 outline-none focus:border-pink-400 text-black appearance-none'
                            name='role'
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value='doctor'>Doctor</option>
                            <option value='patient'>Patient</option>
                        </select>
                    </div>
                </div>
                <div className='flex justify-center mb-6'>
                    <div className='w-1/2'>
                        <label className='block text-black text-sm font-medium mb-1'>
                            Password
                        </label>
                        <input className='w-full p-3 border border-black rounded-md focus:ring-2
                        focus:ring-pink-200 outline-none focus:border-pink-400 placeholder-black/50 text-black'
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        placeholder='Enter password'
                        />
                    </div>
                </div>
                <button className='w-full bg-[rgb(211,46,149)]/60 text-white p-3 rounded-md hover:bg-[rgb(211,46,149)]/80
                font-medium cursor-pointer'>
                    Login
                </button>
            </form>
        </div>
    </div>
  );
};

export default Login;
