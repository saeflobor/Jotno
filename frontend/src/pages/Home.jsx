import React from 'react'
import { Link } from 'react-router-dom'

const Home = ({user, error}) => {
  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4'
      style={{ backgroundImage: "url(/Smiling_Old_Couple_2.jpg)" }}
    > 
      <div className='bg-black/40 backdrop-blur-[5px] p-8 rounded-lg shadow-md w-full max-w-lg text-center'>
        {error && <p className='text-red-500 mb-4 text-sm'>{error}</p>}
        {user ? (
          <div>
            <h2 className='text-2xl font-bold mb-4 text-white'>
              Welcome, {user.username}
            </h2>
            <p className='text-gray-600'>Email: {user.email}</p>
          </div>
        ) : (
          <div>
            <h2 className='text-2xl font-bold mb-6 text-white'>
              Welcome!
            </h2>
            <p className='text-2xl font-bold mb-6 text-white'>Please log in or register</p>
            <div className='flex flex-col space-y-4'>
              <Link className='w-full bg-[rgb(211,46,149)]/60 text-white p-3 rounded-md hover:bg-[rgb(211,46,149)]/80 font-medium' to="/login">Login</Link>
              <Link className='w-full bg-gray-200/60 text-gray-800 p-3 rounded-md hover:bg-gray-300 font-medium' to="/register">Register</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home