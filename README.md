# 🚀 Swiftly - AI-Powered Admin Life Concierge

**Swiftly** is a modern, AI-powered web application that simplifies your daily workflow and boosts productivity. Built with Next.js, Supabase, and Stripe, it provides a comprehensive solution for task management, calendar integration, and AI-powered assistance.

## ✨ Features

### 🎯 **Core Functionality**
- **Task Management** - Organize and track your tasks efficiently
- **Calendar Integration** - Seamless scheduling and event management
- **AI Chat Assistant** - Get intelligent suggestions and help
- **Team Collaboration** - Work together with your team members
- **Real-time Updates** - Instant synchronization across devices

### 💳 **Subscription Plans**
- **Starter Plan** ($5/month) - Basic features for individuals
- **Pro Plan** ($15/month) - Advanced features for power users
- **Secure Payments** - Powered by Stripe with webhook integration

### 🔐 **Authentication & Security**
- **Supabase Auth** - Secure user authentication and management
- **Row Level Security** - Data protection and privacy
- **JWT Tokens** - Secure session management
- **Profile Management** - User profiles with subscription tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payments**: Stripe (Subscriptions, Webhooks)
- **Deployment**: Vercel-ready, Docker-compatible

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Iasonassss0007/Swiftly-0.0.1.git
   cd Swiftly-0.0.1
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-template.txt .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   STRIPE_PRICE_STARTER=price_your_starter_plan_price_id
   STRIPE_PRICE_PRO=price_your_pro_plan_price_id
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up database**
   - Enable the Stripe extension in your Supabase project
   - Run the SQL migration from `STRIPE_SUBSCRIPTION_MIGRATION.sql`

5. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[Stripe Integration Guide](STRIPE_INTEGRATION_README.md)** - Complete setup for subscription payments
- **[Authentication Fixes Summary](AUTHENTICATION_FIXES_SUMMARY.md)** - Troubleshooting guide for auth issues
- **[Dashboard Setup](DASHBOARD_README.md)** - Dashboard configuration and customization

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable the Stripe extension
3. Set up Row Level Security (RLS) policies
4. Configure authentication providers

### Stripe Setup
1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoints
3. Configure test and live keys
4. Set up customer portal

### Environment Variables
All required environment variables are documented in `env-template.txt`. Make sure to:
- Never commit `.env.local` to version control
- Use different keys for development and production
- Keep your service role keys secure

## 🧪 Testing

### Test Stripe Integration
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Test with test cards
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

### Test Authentication
- Sign up with a new account
- Test login/logout flows
- Verify profile creation
- Test subscription flow

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
# Build the image
docker build -t swiftly .

# Run the container
docker run -p 3000:3000 swiftly
```

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up reverse proxy (nginx/Apache)
4. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [documentation](STRIPE_INTEGRATION_README.md)
2. Review [authentication fixes](AUTHENTICATION_FIXES_SUMMARY.md)
3. Search existing [GitHub issues](https://github.com/Iasonassss0007/Swiftly-0.0.1/issues)
4. Create a new issue with detailed information

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Supabase** for the backend infrastructure
- **Stripe** for payment processing
- **TailwindCSS** for the beautiful styling system
- **Framer Motion** for smooth animations

---

**Made with ❤️ by the Swiftly Team**

*Transform your productivity with AI-powered assistance!*
