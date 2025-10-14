"use client";
import React, { useState } from 'react';
import { authAPI } from '@/lib/api';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.signUp(email, password);
      if (response.data.success) {
        console.log('Signed up successfully:', response.data.user);
        window.location.href = '/knowledge'; // Redirect to dashboard or home
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      alert('An error occurred during sign-up.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.signIn(email, password);
      if (response.data.success) {
        // Handle successful login, e.g., redirect to dashboard
        console.log('Signed in successfully:', response.data.user);
        window.location.href = '/knowledge'; // Redirect to dashboard or home
      } else {
        // Handle login failure
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred during sign-in.');
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border border-border shadow-lg">
        <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-foreground">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp ? 'Create an account to get started' : 'Sign in to your account to continue'}
          </p>
        </div>
                        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-input rounded-t-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-input rounded-b-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <a href="#" onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-primary hover:text-primary/80 transition-colors">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
