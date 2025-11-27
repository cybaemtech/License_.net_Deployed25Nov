import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { getSession } from "../utils/session";
import { api } from "../lib/api"; // Updated API client

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = getSession();
    if (session) {
      const from = (location.state as any)?.from || "/";
      navigate(from, { replace: true });
    }
  }, []);

  const validateInput = () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await api.auth.signInWithEmail(email, password);

      if (error) {
        throw error;
      }

      if (data && data.user) {
        setSuccess("Login successful! Redirecting...");

        // Trigger auth change event
        window.dispatchEvent(new Event('authchange'));

        setTimeout(() => {
          const from = (location.state as any)?.from || "/";
          navigate(from, { replace: true });
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during sign in",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(
      "Account creation is not available in this demo. Please use the provided demo credentials.",
    );
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to LicenseHub Enterprise
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Streamline your software license management with enterprise-grade
            security and control.
          </p>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-white mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Centralized Management
                </h3>
                <p className="text-white/80">
                  Manage all your software licenses from a single dashboard
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-white mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Cost Optimization
                </h3>
                <p className="text-white/80">
                  Track and optimize your software spending across teams
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-white mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Compliance & Security
                </h3>
                <p className="text-white/80">
                  Stay compliant with automated license tracking and renewals
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Access your enterprise license management dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 p-4 rounded-lg">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <p className="mt-2 text-sm text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Processing..." : "Sign In"}
              </button>

              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Enterprise Account
              </button>
            </div>
          </form>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
