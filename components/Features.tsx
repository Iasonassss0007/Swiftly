'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    title: "Smart Scheduling",
    description: "AI-powered calendar management that learns your preferences and automatically optimizes your daily schedule for maximum productivity."
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    ),
    title: "Task Management",
    description: "Intelligent task prioritization and automation that helps you focus on what matters most while handling routine work behind the scenes."
  },
  {
    icon: (
      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    title: "Smart Reminders",
    description: "Context-aware notifications that adapt to your workflow and ensure you never miss important deadlines or opportunities."
  }
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
            Everything you need to{' '}
            <span className="gradient-text">stay productive</span>
          </h2>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            Swiftly combines powerful AI with intuitive design to transform how you manage your administrative tasks and daily workflow.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="card h-full group-hover:border-accent-blue/50 group-hover:shadow-accent-blue/20"
              >
                {/* Icon */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 bg-gradient-to-r from-accent-blue/10 to-accent-cyan/10 rounded-xl flex items-center justify-center text-accent-blue mb-6 group-hover:from-accent-blue/20 group-hover:to-accent-cyan/20 transition-all duration-300 border border-accent-blue/20"
                >
                  {feature.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-charcoal mb-4">
                  {feature.title}
                </h3>
                <p className="text-light-gray leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
