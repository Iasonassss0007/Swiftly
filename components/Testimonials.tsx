'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechFlow",
    avatar: "SC",
    quote: "Swiftly has transformed how I manage my daily tasks. The AI scheduling alone saves me 2-3 hours every day."
  },
  {
    name: "Marcus Rodriguez",
    role: "Executive Assistant",
    company: "Global Corp",
    avatar: "MR",
    quote: "The smart reminders and task automation have made me indispensable to my team. I can't imagine working without it."
  },
  {
    name: "Emily Watson",
    role: "Small Business Owner",
    company: "Watson Consulting",
    avatar: "EW",
    quote: "As a solo entrepreneur, Swiftly handles all the admin work I used to hate. Now I can focus on growing my business."
  },
  {
    name: "David Kim",
    role: "Operations Director",
    company: "Innovate Labs",
    avatar: "DK",
    quote: "The productivity insights and automated workflows have increased our team's efficiency by 40%. Game changer."
  }
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Loved by{' '}
            <span className="gradient-text">thousands</span>
          </h2>
          <p className="text-xl text-light-gray max-w-3xl mx-auto">
            See how Swiftly is helping professionals and teams around the world save time and boost productivity.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex space-x-6 pb-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-80 md:w-96"
              >
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="card h-full hover:border-accent-blue/50 hover:shadow-accent-blue/20"
                >
                  {/* Quote Icon */}
                  <div className="text-accent-blue mb-6">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-light-gray text-lg leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-light-gray">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 bg-accent-blue/30 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
