import React from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react';
import { ChevronDown, ChevronUp, Bell, Users, AlertTriangle, Calendar, Activity, FileText, Heart, UserRound, Moon, Sun } from 'lucide-react';

const Home = ({user, error}) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [useDarkBackground, setUseDarkBackground] = useState(false);

  const features = [
    {
      id: 1,
      icon: Bell,
      title: 'Medication Reminders',
      description: 'Timely alerts via notifications or SMS. Family can track if reminders were acknowledged.',
      visible: true
    },
    {
      id: 2,
      icon: Users,
      title: 'Family Supervision',
      description: 'Monitor medication adherence, access records (with permission), view health summaries.',
      visible: true
    },
    {
      id: 3,
      icon: AlertTriangle,
      title: 'Emergency SOS',
      description: 'One-tap SOS button notifies family instantly with message and optional location.',
      visible: true
    },
    {
      id: 4,
      icon: Calendar,
      title: 'Appointment Tracking',
      description: 'Never miss a doctor\'s appointment with our smart scheduling system.',
      visible: showAllFeatures
    },
    {
      id: 5,
      icon: Activity,
      title: 'Health Monitoring',
      description: 'Track vital signs and health metrics with easy-to-use tools.',
      visible: showAllFeatures
    },
    {
      id: 6,
      icon: FileText,
      title: 'Medical Records',
      description: 'Secure digital storage for all your important medical documents.',
      visible: showAllFeatures
    }
  ];

  const testimonials = [
    {
      id: 1,
      text: 'Since using যত্ন, my father never misses his medication. The peace of mind is priceless.',
      author: 'Rahman M. Jr.',
      role: 'Son of Rahman M. Sr.',
      icon: UserRound
    },
    {
      id: 2,
      text: 'The SOS feature saved my grandmother when she fell. Help arrived within minutes!',
      author: 'Farhana K.',
      role: 'Granddaughter of Rahima K.',
      icon: UserRound
    }
  ];

  return (
      <div>
        {error && <p className='text-red-500 mb-4 text-sm'>{error}</p>}
        {user ? (
          <div  className='min-h-screen flex items-center justify-center bg-gray-100 p-4'>
            <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center'>
              <h2 className='text-2xl font-bold mb-4 text-black'>
                Welcome, {user.username}
              </h2>
              <p className='text-black/70'>Email: {user.email}</p>
            </div>
          </div>
        ) : ( 
          // No User Logged In
          <div className="relative min-h-screen overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md"
              style={{ backgroundImage: `url(${useDarkBackground ? '/Smiling_Old_Couple_Black.jpg' : '/Smiling_Old_Couple_White.png'})` }}
            />
            <div className={`absolute inset-0 ${useDarkBackground ? 'bg-black/70' : 'bg-white/30'}`} aria-hidden="true" />
            <div className="relative">
              <button
                onClick={() => setUseDarkBackground(!useDarkBackground)}
                className={`fixed top-5 right-4 z-50 p-2 rounded-full transition duration-300 ${
                  useDarkBackground
                    ? 'bg-black/50 hover:bg-white/50 text-white'
                    : 'bg-black/50 hover:bg-black/10 text-white'
                }`}
                title={useDarkBackground ? 'Switch to light background' : 'Switch to dark background'}
              >
                {useDarkBackground ? (
                  <Sun className="w-8 h-5" />
                ) : (
                  <Moon className="w-8 h-5" />
                )}
              </button>
              <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                  <div className="md:w-1/2">
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>
                      Peace of Mind for You,<br />Care for Your Loved Ones
                    </h1>
                    <p className={`text-lg mb-6 ${useDarkBackground ? 'text-gray-400' : 'text-gray-700'}`}>
                      যত্ন : Jotno helps elderly users have their healthcare needs met, while keeping families connected and informed.
                    </p>
                    <div className="flex gap-4">
                      <Link
                        to="/register"
                        className="bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/50 text-white px-6 py-3 rounded-lg font-medium transition duration-300"
                      >
                        Get Started
                      </Link>
                      <Link
                        to="/login"
                        className="border-2 border-[rgb(211,46,149)] text-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/30 px-6 py-3 rounded-lg font-medium transition duration-300"
                      >
                        Login
                      </Link>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <img
                      src={useDarkBackground ? "Smiling_Old_Couple_Black.jpg" : "Smiling_Old_Couple_White.png"}
                      alt="Happy elderly couple"
                      className="rounded-2xl w-full shadow-[0px_0px_40px_rgba(255,255,255,0.40)]"
                    />
                  </div>
                </div>
              </section>

              <section className="container mx-auto px-4 py-16">
                <h2 className={`text-3xl font-bold text-center mb-12 ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>How We Help</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {features.map((feature) => {
                    if (!feature.visible) return null;
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={feature.id}
                        className={`${useDarkBackground ? 'bg-black/30' : 'bg-white/30'} backdrop-blur-[40px] p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300`}
                      >
                        <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mb-4">
                          <IconComponent className="text-black w-6 h-6" />
                        </div>
                        <h3 className={`text-xl font-semibold mb-2 ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                        <p className={useDarkBackground ? 'text-gray-400' : 'text-gray-700'}>{feature.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowAllFeatures(!showAllFeatures)}
                    className="bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/50 text-white px-6 py-3 rounded-lg font-medium transition duration-300 flex items-center gap-2"
                  >
                    <span>{showAllFeatures ? 'Show Fewer Features' : 'View All Features'}</span>
                    {showAllFeatures ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </section>

              <section className={`container mx-auto px-4 py-16  ${useDarkBackground ? 'bg-black/30' : 'bg-white/30'} backdrop-blur-[40px] rounded-xl`}>
                <h2 className={`text-3xl font-bold text-center mb-12 ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>What Families Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                  {testimonials.map((testimonial) => {
                    const IconComponent = testimonial.icon;
                    return (
                    <div key={testimonial.id} className={`${useDarkBackground ? 'bg-black/30' : 'bg-white/30'} backdrop-blur-[40px] p-6 rounded-lg shadow`}>
                      <p className={`italic mb-4 ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>{testimonial.text}</p>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full mr-4 bg-pink-200 flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>{testimonial.author}</h4>
                          <p className={`text-sm ${useDarkBackground ? 'text-gray-500' : 'text-gray-600'}`}>{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>

              {/* CTA Section */}
              <section className="container mx-auto px-4 py-16">
                <div className={`bg-[rgb(211,46,149)]/60 rounded-xl p-8 text-center ${useDarkBackground ? 'text-white' : 'text-gray-900'}`}>
                  <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                  <p className="text-lg mb-6 max-w-2xl mx-auto">
                    Join thousands of families who trust যত্ন : Jotno for their loved ones' care
                  </p>
                  <Link
                    to="/register"
                    className="inline-block bg-white text-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/20 px-8 py-3 rounded-lg font-medium transition duration-300"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
  )
}

export default Home