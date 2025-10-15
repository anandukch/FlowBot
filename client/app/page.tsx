'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Workflow, 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Menu,
  X,
  Play,
  ChevronRight,
  Globe,
  Smartphone,
  Clock,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleAuthAction = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI-Powered Assistant",
      description: "Smart conversations with natural language processing and context awareness",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Workflow className="w-8 h-8" />,
      title: "Smart Workflows",
      description: "Automated approval chains with multi-step processes and delegation support",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Multi-Channel Integration",
      description: "Slack, email, and web widget integration for seamless communication",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Real-time approvals, delegation, and team-based decision making",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-time Updates",
      description: "Instant notifications via Server-Sent Events and live status tracking",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Role-based permissions, audit trails, and compliance-ready features",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime" },
    { number: "< 200ms", label: "Response Time" },
    { number: "10x", label: "Faster Approvals" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FlowBot
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <button
                onClick={handleAuthAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-700">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-slate-300 hover:text-white">Features</a>
              <a href="#how-it-works" className="block text-slate-300 hover:text-white">How it Works</a>
              <a href="#pricing" className="block text-slate-300 hover:text-white">Pricing</a>
              <button
                onClick={handleAuthAction}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2"
              >
                <span>{isAuthenticated ? 'Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Smart Customer Support
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                with AI Workflows
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              FlowBot revolutionizes customer support with intelligent AI assistants and automated approval workflows. 
              Handle complex requests seamlessly while maintaining human oversight.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={handleAuthAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="border-2 border-slate-600 text-slate-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Dashboard Preview Images */}
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
                  Experience FlowBot in Action
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
                  Take a visual journey through our powerful features and see how FlowBot transforms customer support
                </p>
              </div>
              
              {/* Feature Showcase with Staggered Animation */}
              <div className="space-y-32">
                {/* Widget Customization - Left Aligned */}
                <div className="flex flex-col lg:flex-row items-center gap-12 animate-slide-in-left">
                  <div className="lg:w-1/2 space-y-6">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                      <span className="text-blue-400 text-sm font-medium">Step 1</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white">
                      Customize Your Widget
                    </h3>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      Design your perfect chat widget with our intuitive customization interface. 
                      Adjust colors, positioning, and behavior with real-time preview to match your brand perfectly.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Real-time Preview</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Brand Matching</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Easy Setup</span>
                    </div>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="group relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-500 group-hover:transform group-hover:scale-105">
                        <div className="rounded-xl overflow-hidden border border-slate-600 hover:border-blue-400/50 transition-all duration-500">
                          <img 
                            src="/widget_customizarion.png" 
                            alt="Widget Customization Dashboard"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Widget - Right Aligned */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 animate-slide-in-right">
                  <div className="lg:w-1/2 space-y-6">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                      <span className="text-purple-400 text-sm font-medium">Step 2</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white">
                      Engage Your Customers
                    </h3>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      Provide instant, intelligent responses through our beautiful chat interface. 
                      Your customers get immediate help while complex requests are seamlessly escalated for approval.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">AI-Powered</span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Instant Response</span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Smart Escalation</span>
                    </div>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="group relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-500 group-hover:transform group-hover:scale-105">
                        <div className="rounded-xl overflow-hidden border border-slate-600 hover:border-purple-400/50 transition-all duration-500">
                          <img 
                            src="/widget.png" 
                            alt="Chat Widget Interface"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Templates - Left Aligned */}
                <div className="flex flex-col lg:flex-row items-center gap-12 animate-slide-in-left">
                  <div className="lg:w-1/2 space-y-6">
                    <div className="inline-flex items-center px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                      <span className="text-green-400 text-sm font-medium">Step 3</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white">
                      Design Smart Workflows
                    </h3>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      Create sophisticated approval templates that handle any business scenario. 
                      Set up multi-step processes, define approval chains, and automate decision routing.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Multi-Step Process</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Smart Routing</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Flexible Rules</span>
                    </div>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="group relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-green-500/50 transition-all duration-500 group-hover:transform group-hover:scale-105">
                        <div className="rounded-xl overflow-hidden border border-slate-600 hover:border-green-400/50 transition-all duration-500">
                          <img 
                            src="/templates.png" 
                            alt="Approval Templates Dashboard"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Dashboard - Right Aligned */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 animate-slide-in-right">
                  <div className="lg:w-1/2 space-y-6">
                    <div className="inline-flex items-center px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/20">
                      <span className="text-orange-400 text-sm font-medium">Step 4</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white">
                      Monitor & Manage
                    </h3>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      Keep track of all approvals in one centralized dashboard. 
                      Monitor pending requests, review completed workflows, and maintain full visibility over your approval processes.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Real-time Tracking</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Full Visibility</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Quick Actions</span>
                    </div>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="group relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all duration-500 group-hover:transform group-hover:scale-105">
                        <div className="rounded-xl overflow-hidden border border-slate-600 hover:border-orange-400/50 transition-all duration-500">
                          <img 
                            src="/approval_dashboard.png" 
                            alt="Approval Dashboard"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Everything you need to automate customer support while maintaining the human touch
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl border border-slate-700 hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 bg-slate-900/50">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How FlowBot Works
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Simple setup, powerful automation, seamless integration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/25">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Customer Interaction</h3>
              <p className="text-slate-300">Customer asks a question through your website widget, Slack, or email</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-purple-500/25">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Processing</h3>
              <p className="text-slate-300">FlowBot analyzes the request and determines if approval is needed</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-green-500/25">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Instant Response</h3>
              <p className="text-slate-300">Customer receives immediate response with approval status and next steps</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of businesses already using FlowBot to automate their workflows
          </p>
          <button
            onClick={handleAuthAction}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
          >
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Your Free Trial'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">FlowBot</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Smart customer support with intelligent approval workflows. 
                Automate complex processes while maintaining human oversight.
              </p>
              <div className="flex space-x-4">
                <Globe className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
                <MessageSquare className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
                <Users className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2024 FlowBot. All rights reserved. Made with ❤️ by the FlowBot Team.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
