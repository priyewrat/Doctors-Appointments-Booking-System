import React, { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiMail } from "react-icons/fi"; // ✅ using react-icons
import { DoctorContext } from "../../context/DoctorContext";

const ForgotPassword = () => {
  const { backendUrl } = useContext(DoctorContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double clicks
    setLoading(true);

    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/forgot-password",
        { email }
      );
      toast.success(data.message);
      setEmail("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-15 flex items-center justify-center from-blue-50 to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-10 border border-gray-200 rounded-2xl max-w-md w-full shadow-xl bg-white/80 backdrop-blur-md"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-3xl font-extrabold text-indigo-700 mb-2">
            Reset Password
          </p>
          <p className="text-sm text-gray-500">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Input with FiMail icon */}
        <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <FiMail className="text-gray-400 mr-2 text-lg" />
          <input
            type="email"
            placeholder="Your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full focus:outline-none bg-transparent"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          } text-white py-3 rounded-lg font-semibold shadow-md transition-transform transform cursor-pointer hover:scale-105`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* Footer text */}
        <p className="text-sm text-gray-500 text-center mt-2">
          We’ll send a reset link to your email.
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
