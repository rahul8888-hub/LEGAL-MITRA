import React from "react";
import { useNavigate } from "react-router-dom";
import rightImage from "../assets/rightImage.png";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import arrow_icon from "../assets/arrow_icon.svg";
import Navbar from "./Navbar";
import ServicesPage from "./ServicesPage";

const Header = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/services');
  };

  return (
    <div>
    <Navbar />
    <section
      className="flex flex-col md:flex-row items-center px-6 md:px-20 lg:px-32 py-30 md:py-16 min-h-screen"
      id="Home"
    >
      <div className="w-full text-center md:w-3/5 md:text-left">
        <motion.h1
          className="text-4xl lg:text-6xl font-bold text-gray-900 leading-[1.1]"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
        >
          Understand Law, <br />  Make Right Choices.
        </motion.h1>
        <h2 className="text-3xl lg:text-6xl font-bold text-indigo-600 my-2">
          <Typewriter
            words={[
                "AI Legal Help.",
                "Fair Document Check.",
                "Easy Research Tools.",
                "Smart Legal Solutions.",
            ]}
            loop={0}
            cursor
            cursorStyle="|"
            typeSpeed={120}
            deleteSpeed={120}
            delaySpeed={3000}
          />
        </h2>
        <motion.p
          className="text-gray-600 mt-10 text-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 2 }}
        >
          LegalMinds AI simplifies legal research and document review for Indian lawyers.
          <br />
          It boosts efficiency while ensuring strong ethical standards are followed.
        </motion.p>

        <motion.button
          onClick={handleGetStarted}
          className="group flex items-center gap-3 px-8 py-4 border-md bg-indigo-600 mt-4 text-white mt-20 px-10 ml-25 md:mt-6 md:ml-0
             hover:bg-white hover:text-indigo-600 hover:border rounded-lg cursor-pointer "
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
        >
          Let's Get Started
          {/* Arrow Icon */}
          <div
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 
                  group-hover:bg-indigo-600 group-hover:text-white"
          >
            <img src={arrow_icon} alt="→" className="w-5 h-5" />
          </div>
        </motion.button>
      </div>

      <motion.div
        className="w-full md:w-2/5 flex justify-center mt-8 md:mt-0"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 2 }}
      >
        <img src={rightImage} alt="Encryption" className="max-w-full h-auto" />
      </motion.div>
    </section>
    <ServicesPage/>
    </div>
  );
};

export default Header;