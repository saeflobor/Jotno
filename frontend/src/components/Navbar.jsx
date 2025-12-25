import React from 'react'
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, setUser }) => {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate('/');
  }

  return (
    <nav className='bg-black'>
      <div className='bg-[rgb(211,46,149)] backdrop-blur-md p-4'>
        <div className='container mx-auto relative flex justify-center items-center'>
          <p className='text-white absolute left-0'>Peace of Mind for You,<br />Care for Your Loved Ones</p>
          <Link to="/" className='text-white text-[30px] font-bold'>Jotno</Link>
          <div className='absolute right-0'>
            {user ? (
              <button onClick={handleLogout}
              className='text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600'>
                Logout
              </button>
            ) : (
              <>
                <Link className="text-white mx-2 hover:underline" to="/login">
                  Login
                </Link>
                <Link className="text-white mx-2 hover:underline" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar