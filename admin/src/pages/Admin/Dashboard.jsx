import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

const Dashboard = () => {
  const {
    aToken,
    getDashData,
    getAllAppointments,
    appointments,
    cancelAppointment,
    dashData,
  } = useContext(AdminContext);

  const { slotDateFormat, currency, formatOrderDate } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getDashData();
      getAllAppointments();
    }
  }, [aToken]);

  return (
    dashData && (
      <div className="m-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={assets.doctor_icon} alt="" />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {dashData.doctors}
              </p>
              <p className="text-gray-400">Doctors</p>
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
                  src={item.docData.image}
                  alt=""
                />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">
                    {item.docData.name}
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

        {/* Payments Section */}
        <div className="bg-white mt-10">
          <div className="flex items-center gap-2.5 px-4 py-4 rounded-t border border-zinc-200">
            <img className="w-12" src={assets.payment_icon} alt="" />
            <p className="font-semibold">All Payments</p>
          </div>
          <div className="overflow-x-auto border border-zinc-200 border-t-0">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Patient </th>
                  <th className="px-6 py-3">Doctor </th>
                  <th className="px-6 py-3">Fees</th>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments
                  .filter((item) => item.orderId && item.orderDate)
                  .map((item, index) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{index + 1}</td>
                      <td className="px-6 py-3">
                        {/* Patient */}
                        <div className="flex items-center gap-2">
                          <img
                            className="w-8 h-8 rounded-full object-cover"
                            src={item.userData.image}
                            alt=""
                          />
                          <p>{item.userData.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {/* Doctor */}
                        <div className="flex items-center gap-2">
                          <img
                            className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                            src={item.docData.image}
                            alt=""
                          />
                          <p>{item.docData.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {currency} {item.amount}
                      </td>
                      <td className="px-6 py-3">{item.orderId}</td>
                      <td className="px-6 py-3">
                        {formatOrderDate(item.orderDate)}
                      </td>
                      <td className="px-6 py-3">
                        {/* Actions */}
                        {item.cancelled ? (
                          <p className="text-red-400 text-xs font-medium">
                            Cancelled
                          </p>
                        ) : item.isCompleted ? (
                          <p className="text-green-500 text-xs font-medium">
                            Completed
                          </p>
                        ) : (
                          <p className="text-green-400 text-xs font-medium">
                            Active
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Payout Section */}
        <div className="bg-white mt-10">
          <div className="flex items-center gap-2.5 px-4 py-4 rounded-t border border-zinc-200">
            <img className="w-12" src={assets.payout_icon} alt="" />
            <p className="font-semibold">Doctor's Payout</p>
          </div>
          <div className="overflow-x-auto border border-zinc-200 border-t-0">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-3 text-center">#</th>
                  <th className="px-6 py-3 text-center">Doctor Name </th>
                  <th className="px-6 py-3 text-center">Email </th>
                  <th className="px-6 py-3 text-center">Reg No</th>
                  <th className="px-6 py-3 text-center">Total Patient</th>
                  <th className="px-6 py-3 text-center">Total Earnings</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashData.doctorSummary.map((item, index) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{index + 1}</td>
                      <td className="px-6 py-3">
                        {/* Patient */}
                        <div className="flex items-center gap-2">
                          <img
                            className="w-8 h-8 rounded-full object-cover"
                            src={item.image}
                            alt=""
                          />
                          <p>{item.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {/* Doctor */}
                        <div className="text-center">
                          <p>{item.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {item.reg_number}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {item.totalPatients}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {currency} {item.totalEarnings}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {/* Actions */}
                        {item.available ? (
                          <p className="text-green-400 text-xs font-medium">
                            Available
                          </p>
                        ) : (
                          <p className="text-red-400 text-xs font-medium">
                            Not Available
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  );
};

export default Dashboard;
