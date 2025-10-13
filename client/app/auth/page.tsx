"use client";
import React, { useState } from 'react';
import axios from 'axios';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/web/signup`,
                { email, password },
                { withCredentials: true }
            );
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
      const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/web/signin`,
                { email, password },
                { withCredentials: true }
            );
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          <p className="mt-2 text-sm text-gray-600">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <a href="#" onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-indigo-600 hover:text-indigo-500">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
