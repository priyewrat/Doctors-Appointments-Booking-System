import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi"; // lock + eye icons
import { DoctorContext } from "../../context/DoctorContext";


const ResetPassword = () => {
  const { backendUrl } = useContext(DoctorContext);
  const { dToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/reset-password/${dToken}`,
        { password }
      );
      toast.success(data.message);
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      toast.error(msg);
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired")
      ) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-15 flex items-center justify-center from-orange-100 via-pink-100 to-red-100">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-10 border border-pink-200 rounded-2xl max-w-md w-full shadow-xl bg-white/80 backdrop-blur-md"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-3xl font-extrabold text-rose-600 mb-2">
            Set New Password
          </p>
          <p className="text-sm text-gray-600">
            Choose a strong password to secure your account
          </p>
        </div>

        {/* Password input */}
        <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-rose-400 transition">
          <FiLock className="text-rose-400 mr-2 text-lg" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 text-gray-500 focus:outline-none"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {/* Confirm Password input */}
        <div className="flex items-center border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-rose-400 transition">
          <FiLock className="text-rose-400 mr-2 text-lg" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="ml-2 text-gray-500 focus:outline-none"
          >
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className={`${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          } text-white py-3 rounded-lg font-semibold shadow-md transition-transform transform hover:scale-105`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
