'use client'

import { motion } from 'framer-motion'

export default function CTABanner() {
  return (
    <section className="py-24 bg-gradient-to-r from-white to-light-bg relative overflow-hidden overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-10 w-20 h-20 bg-accent-blue/10 rounded-full blur-2xl"
          style={{ transform: 'translateZ(0)' }}
        />
        <motion.div
          animate={{ 
            y: [0, 40, 0],
            rotate: [180, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 left-10 w-16 h-16 bg-accent-cyan/10 rounded-full blur-2xl"
          style={{ transform: 'translateZ(0)' }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6 text-balance">
            Join thousands of users who save time every day with Swiftly
          </h2>
          
          <p className="text-xl text-light-gray mb-10 max-w-2xl mx-auto">
            Start your free trial today and experience the power of AI-driven productivity. No credit card required.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <a
              href="#get-started"
              className="inline-block bg-gradient-to-r from-accent-blue to-accent-cyan text-white px-10 py-5 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:from-accent-cyan hover:to-accent-blue animate-glow"
            >
              Get Started Now
            </a>
          </motion.div>

          <p className="text-sm text-light-gray mt-6">
            Free 14-day trial • Cancel anytime • No setup fees
          </p>
        </motion.div>
      </div>
    </section>
  )
}
