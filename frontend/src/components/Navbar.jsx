import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { GoHomeFill } from 'react-icons/go';

const Navbar = ({ user, setUser }) => {

  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("token");
      setUser(null);
      navigate('/');
    }
  }

  return (
    <nav className='bg-black'>
      <div className='bg-[rgb(211,46,149)] backdrop-blur-md p-4'>
        <div className='container mx-auto relative flex justify-center items-center'>
          <div className='absolute left-0 flex items-center gap-3'>
            <Link to="/" className='mr-10 text-white hover:opacity-80 transition'>
              <GoHomeFill className='text-3xl' />
            </Link>
            <p className='text-white'>Peace of Mind for You,<br />Care for Your Loved Ones</p>
          </div>
          <Link to="/" className='text-white text-[30px] font-bold'>
            <button onClick={(e) => {
              if (user) {
                e.preventDefault();
                window.location.href = '/dashboard';
              }
            }}>
              Jotno
            </button>
          </Link>
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