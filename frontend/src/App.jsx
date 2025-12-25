import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import FamilyIntegration from './pages/FamilyIntegration';
import NotFound from './components/NotFound';
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
        } catch (err) {
          setError('Failed to fetch user data');
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-xl text-white'>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Home />} />

        {/* Protected Dashboard page */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />

        {/* Protected Family Integration page */}
        <Route 
          path="/family-integration" 
          element={user ? <FamilyIntegration user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />

        {/* Login & Register */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} 
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;



