import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../assets/logo.png"

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMobileMenu]);

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleActiveSection = () => {
      const sections = ['Home', 'Compute', 'About', 'Contact'];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleActiveSection);
    return () => window.removeEventListener('scroll', handleActiveSection);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#Home' },
    { name: 'Chat with AI', href: '/compute' },
    { name: 'Generate Legal Doc', href: '/generate' },
    { name: 'Outcome Prediction', href: '/outcome' },
  ];

  // Color palette
  // Primary: #1A3D5A (dark blue)
  // Secondary: #3498DB (bright blue)
  // Accent: #22C55E (green)
  // Background: #FFFFFF (white)
  // Text: #1E293B (slate gray)

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      <div className='container mx-auto flex items-center justify-between py-4 px-6 md:px-10 lg:px-16'>
        {/* Logo */}
        <a href="#Home" className="flex items-center gap-2">
          <h1 className="text-xl ml-5 mt-2 font-bold text-[#1A3D5A] "><img src={logo} alt="" width={140} height={120}/></h1>
        </a>
        
        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex flex-1 justify-center">
          <ul className='flex gap-12'>
            {navLinks.map((link) => (
              <li key={link.name}>
                <a 
                  href={link.href} 
                  className={`relative py-2 px-1 font-medium transition-colors ${
                    activeSection === link.name ? 'text-indigo-600' : 'text-[#1E293B]'
                  } hover:text-indigo-600`}
                >
                  {link.name}
                  {activeSection === link.name && (
                    <motion.span 
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Contact Button */}
        <a href="#Contact">
          <button className='hidden md:block bg-indigo-600 text-white px-8 py-2 rounded-full hover:bg-white hover:text-indigo-600 hover:border border-indigo-600 transition-all duration-300 cursor-pointer'>
            Contact us
          </button>
        </a>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(true)} 
          className='md:hidden rounded-full p-2 text-[#1A3D5A] hover:bg-[#F8FAFC] transition-colors'
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Mobile Menu with Framer Motion */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            className="fixed inset-0 bg-white z-50 md:hidden flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <a href="#Home" className="flex items-center gap-2" onClick={() => setShowMobileMenu(false)}>
                <div className="h-8 w-8 bg-[#1A3D5A] rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <h1 className="text-xl font-bold text-[#1A3D5A]">Level-Up</h1>
              </a>
              <button 
                onClick={() => setShowMobileMenu(false)} 
                className='rounded-full p-2 hover:bg-gray-50 text-[#1A3D5A] transition-colors'
                aria-label="Close Menu"
              >
                <X size={24} />
              </button>
            </div>
            
            <motion.nav 
              className="flex-1 flex flex-col justify-center"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { 
                    staggerChildren: 0.1,
                  }
                }
              }}
            >
              <ul className='flex flex-col items-center gap-8 text-lg'>
                {navLinks.map((link) => (
                  <motion.li 
                    key={link.name} 
                    className="w-full text-center"
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                  >
                    <a 
                      href={link.href} 
                      className={`block py-3 font-medium transition-colors hover:text-indigo-600 ${
                        activeSection === link.name ? 'text-indigo-600' : 'text-[#1E293B]'
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
                <motion.li 
                  className="w-full text-center pt-4"
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 }
                  }}
                >
                  <a 
                    href="#Contact" 
                    className="inline-block bg-green-900 text-white px-8 py-2 rounded-full hover:bg-white hover:text-green-900 hover:border border-green-900 transition-all duration-300 w-3/4"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Contact us
                  </a>
                </motion.li>
              </ul>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;