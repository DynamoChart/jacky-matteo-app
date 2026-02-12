// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/DataContext';

import { Button, Input, Card, CardHeader, CardFooter, Link } from '@heroui/react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Logom from "../newp.png"
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // changed to false → hidden by default
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      const token = data.token || data.accessToken || data.access_token;

      if (!token) {
        throw new Error('No token received from server');
      }

      login(token);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
        <CardHeader className="flex flex-col items-center gap-4 pt-10 pb-0 px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="w-40 h-30 bg-primary/10 flex items-center justify-center ">
           <img src={Logom} alt="" />
          </div>
          <h1 className="text-3xl font-bold text-foreground text-center">
            Welcome Back
          </h1>
          <p className="text-center text-default-500 text-base">
            {/* You can add subtitle here if you want */}
          </p>
        </CardHeader>

        <CardFooter className="flex flex-col gap-6 p-8">
          <form onSubmit={handleLogin} className="space-y-6 w-full">
            {/* Email Field */}
            <div className="relative">
              <Input
                type="email"
                label="Email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                fullWidth
                variant="ghost"      // adjust variant if needed (flat, bordered, etc.)
                color={error ? 'danger' : 'default'}
                size="lg"
                radius="lg"
                isRequired
                autoComplete="email"
                autoFocus
                isInvalid={!!error}
                className="border-gray-900 bg-success-soft"
                // errorMessage is shown only when isInvalid
                errorMessage={error && error.includes('email') ? error : undefined}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                variant="ghost"
                color={error ? 'danger' : 'default'}
                size="lg"
                radius="lg"
                isRequired
                autoComplete="current-password"
                isInvalid={!!error}
                errorMessage={error && !error.includes('email') ? error : undefined}
                className="border-gray-900 bg-success-soft"
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-default-100 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-6 text-default-500" />
                ) : (
                  <Eye className="size-6 text-default-500" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              variant="danger-soft"
              size="lg"
              fullWidth
              radius="lg"
              isLoading={loading}
              loadingText="Logging in..."
              className=" font-semibold "
            >
              Login
            </Button>
          </form>

          {/* Optional footer note like in sample */}
          <div className="text-center text-xs text-default-400 pt-2">
            Powered by{" "}
            <Link
              href="https://globalpackagetracker.com/"
              isExternal
              showAnchorIcon
              className="text-primary hover:underline"
            >
              Dynamochart
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}