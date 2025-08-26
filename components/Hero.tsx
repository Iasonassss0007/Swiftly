'use client'

import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section id="home" className="min-h-screen bg-light-bg flex items-center relative overflow-hidden overflow-x-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #404040 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Floating Accent Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            y: [0, -50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-accent-blue/10 to-accent-cyan/10 rounded-full blur-3xl"
          style={{ transform: 'translateZ(0)' }}
        />
        <motion.div
          animate={{ 
            y: [0, 60, 0],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 rounded-full blur-3xl"
          style={{ transform: 'translateZ(0)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-charcoal leading-tight text-balance"
            >
              Your AI Admin Life{' '}
              <span className="gradient-text">Concierge</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 text-xl md:text-2xl text-light-gray max-w-2xl mx-auto lg:mx-0 text-balance"
            >
              Save hours every day by automating administrative tasks, scheduling, and productivity optimization with AI-powered intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a href="#get-started" className="btn-primary">
                Get Started
              </a>
              <a href="#learn-more" className="btn-secondary">
                Learn More
              </a>
            </motion.div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Dashboard Mockup */}
            <div className="relative bg-white border border-dark-gray/20 rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="h-4 bg-accent-blue/20 rounded"></div>
                  <div className="h-4 bg-accent-cyan/20 rounded w-3/4"></div>
                  <div className="h-4 bg-accent-purple/20 rounded w-1/2"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="h-20 bg-success/10 rounded-lg flex items-center justify-center border border-success/20">
                    <div className="w-8 h-8 bg-success rounded-full animate-glow"></div>
                  </div>
                  <div className="h-20 bg-accent-blue/10 rounded-lg flex items-center justify-center border border-accent-blue/20">
                    <div className="w-8 h-8 bg-accent-blue rounded-full animate-float"></div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-light-gray/20 rounded w-full"></div>
                  <div className="h-3 bg-light-gray/15 rounded w-4/5"></div>
                  <div className="h-3 bg-light-gray/20 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-accent-cyan to-accent-blue rounded-full flex items-center justify-center animate-glow z-20"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </motion.div>
            
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-accent-purple to-accent-blue rounded-full flex items-center justify-center animate-float z-20"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </motion.div>

            {/* Floating Dashboard Mockup - Positioned to not interfere with text */}
            <motion.div
              animate={{ 
                y: [-20, 20, -20],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className="absolute -top-16 -right-16 z-10"
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="relative bg-white border border-dark-gray/20 rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-error rounded-full"></div>
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-3 bg-accent-blue/20 rounded"></div>
                    <div className="h-3 bg-accent-cyan/20 rounded w-3/4"></div>
                    <div className="h-3 bg-accent-purple/20 rounded w-1/2"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-16 bg-success/10 rounded-lg flex items-center justify-center border border-success/20">
                      <div className="w-6 h-6 bg-success rounded-full animate-glow"></div>
                    </div>
                    <div className="h-16 bg-accent-blue/10 rounded-lg flex items-center justify-center border border-accent-blue/20">
                      <div className="w-6 h-6 bg-accent-blue rounded-full animate-float"></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 bg-light-gray/20 rounded w-full"></div>
                    <div className="h-2 bg-light-gray/15 rounded w-4/5"></div>
                    <div className="h-2 bg-light-gray/20 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
