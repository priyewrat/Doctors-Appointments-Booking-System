import React, { use, useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const DoctorDashboard = () => {
  const {
    dashData,
    setDashData,
    getDashData,
    dToken,
    completeAppointment,
    cancelAppointment,
    backendUrl,
  } = useContext(DoctorContext);

  const { currency, slotDateFormat, formatOrderDate } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getDashData();
      // Poll every 5 seconds
      const interval = setInterval(() => {
        getDashData();
      }, 5000);

      // Cleanup when component unmounts
      return () => clearInterval(interval);
    }
  }, [dToken]);

  // ----------------- Subscription -----------------
  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Doctor Subscription",
      description: "Subscription Fee",
      order_id: order.id,
      handler: async (response) => {
        try {
          await axios.post(
            backendUrl + "/api/doctor/subscription/verify",
            { razorpay_order_id: response.razorpay_order_id },
            { headers: { dToken } },
          );
          toast.success("Subscription successful");
          getDashData(); // refresh dashboard after payment
        } catch (error) {
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const subscribeDoctor = async (doctorId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/subscription/payment",
        { doctorId },
        { headers: { dToken } },
      );

      if (data.success) {
        initPay(data.order); // ✅
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    dashData && (
      <div className="m-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.earning_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {currency} {dashData.earnings}
              </p>
              <p className="text-gray-400">Earnings</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.appointment_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.appointments}
              </p>
              <p className="text-gray-400">Appointments</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.patients_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.patients}
              </p>
              <p className="text-gray-400">Patients</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-start gap-2">
            {dashData.subscriptionActive ? (
              <button
                className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md cursor-default 
                 transition-transform transform hover:scale-105"
                disabled
              >
                Subscribed
              </button>
            ) : (
              <button
                onClick={() => subscribeDoctor(dashData.doctorId)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg 
                 shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 
                 transform hover:scale-105"
              >
                Subscribe
              </button>
            )}

            {!dashData.subscriptionActive && (
              <p className="text-red-500 text-sm font-medium">
                Your plan has expired. Please renew to continue.
              </p>
            )}
          </div>
        </div>
        <div className="bg-white">
          <div className="flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border border-zinc-200">
            <img src={assets.list_icon} alt="" />
            <p className="font-semibold">Latest Bookings</p>
          </div>
          <div className="pt-4 border border-zinc-200 border-t-0">
            {dashData.latestAppointments.map((item, index) => (
              <div
                className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
                key={index}
              >
                <img
                  className="rounded-full w-10"
                  src={item.userData.image}
                  alt=""
                />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">
                    {item.userData.name}
                  </p>
                  <p className="text-gray-600">
                    {formatOrderDate(`${item.slotDate}T${item.slotTime}`)}
                  </p>
                </div>
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">
                    Completed
                  </p>
                ) : (
                  <div className="flex">
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.cancel_icon}
                      alt=""
                    />
                    <img
                      onClick={() => completeAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.tick_icon}
                      alt=""
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;
