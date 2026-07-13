"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

type Step = "register" | "verify" | "complete";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Verify form
  const [token, setToken] = useState("");

  // Complete form
  const [address, setAddress] = useState("");

  const registerMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
    }) => api.post("/api/register", data).then((r) => r.data),
    onSuccess: (data) => {
      setUserId(data.data?.id || data.userId || "");
      setStep("verify");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Registration failed");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: { userId: string; token: string }) =>
      api
        .post(`/api/verify?userId=${data.userId}&token=${data.token}`)
        .then((r) => r.data),
    onSuccess: () => {
      setStep("complete");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Verification failed");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      name: string;
      phone: string;
      address?: string;
    }) => api.post("/api/complete-register", data).then((r) => r.data),
    onSuccess: () => {
      router.push("/login");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Completion failed");
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMutation.mutate({ name, email, password, phone });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    verifyMutation.mutate({ userId, token });
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    completeMutation.mutate({ userId, name, phone, address });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            IW
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Step {step === "register" ? "1" : step === "verify" ? "2" : "3"} of
            3
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {["register", "verify", "complete"].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  (step === "register" && i <= 0) ||
                  (step === "verify" && i <= 1) ||
                  step === "complete"
                    ? "bg-primary-600"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-danger-50 text-danger-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Register */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                type="submit"
                fullWidth
                loading={registerMutation.isPending}
                disabled={!name || !email || !password || !phone}
              >
                Continue
              </Button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-600">
                We sent a verification code to <strong>{email}</strong>
              </p>
              <Input
                label="Verification Code"
                placeholder="Enter OTP code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              <Button
                type="submit"
                fullWidth
                loading={verifyMutation.isPending}
                disabled={!token}
              >
                Verify
              </Button>
            </form>
          )}

          {/* Step 3: Complete Profile */}
          {step === "complete" && (
            <form onSubmit={handleComplete} className="space-y-4">
              <p className="text-sm text-gray-600">
                Complete your profile to get started
              </p>
              <Input
                label="Address"
                placeholder="Your address (optional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                loading={completeMutation.isPending}
              >
                Complete Registration
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <a
              href="/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
