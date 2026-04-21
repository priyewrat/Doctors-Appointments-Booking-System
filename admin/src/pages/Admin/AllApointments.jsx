import React, { useEffect, useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } =
    useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency, formatOrderDate } =
    useContext(AppContext);

  useEffect(() => {
    getAllAppointments();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      getAllAppointments();
    }, 5000);

    // Cleanup when component unmounts
    return () => clearInterval(interval);
  }, [aToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border border-zinc-100 rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr_1fr] py-3 px-6 border-b border-zinc-300 font-medium text-gray-700">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Payment Status</p>
          <p>Actions</p>
        </div>

        {/* Table Rows */}
        {appointments
          .slice()
          .reverse()
          .map((item, index) => (
            <div
              className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b border-gray-300 hover:bg-gray-50"
              key={index}
            >
              {/* Index */}
              <p className="max-sm:hidden">{index + 1}</p>

              {/* Patient */}
              <div className="flex items-center gap-2">
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={item.userData.image}
                  alt=""
                />
                <p>{item.userData.name}</p>
              </div>

              {/* Age */}
              <p className="max-sm:hidden pr-2">
                {calculateAge(item.userData.dob)
                  ? calculateAge(item.userData.dob)
                  : item.userData.dob}
              </p>

              {/* Date & Time */}
              <p>{formatOrderDate(`${item.slotDate}T${item.slotTime}`)}</p>

              {/* Doctor */}
              <div className="flex items-center gap-2">
                <img
                  className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                  src={item.docData.image}
                  alt=""
                />
                <p>{item.docData.name}</p>
              </div>

              {/* Fees */}
              <p>
                {currency}
                {item.amount}
              </p>

              {/* Payment Status */}
              <p
                className={
                  item.payment ? "text-green-500 font-medium" : "text-zinc-500"
                }
              >
                {item.payment ? "Paid" : "Not Paid"}
              </p>

              {/* Actions */}
              {item.cancelled ? (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              ) : item.isCompleted ? (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-9 h-9 cursor-pointer"
                  src={assets.cancel_icon}
                  alt="Cancel"
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AllAppointments;
