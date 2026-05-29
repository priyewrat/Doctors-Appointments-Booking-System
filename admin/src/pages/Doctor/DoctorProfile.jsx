import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { FiClock, FiCalendar, FiTrash2, FiPlus, FiInfo } from "react-icons/fi";

const DoctorProfile = () => {
  const {
    dToken,
    profileData,
    setProfileData,
    getProfileData,
    backendUrl,
    availabilities,
    getAvailability,
    addAvailability,
    updateAvailability,
    deleteAvailability,
  } = useContext(DoctorContext);
  const { currency } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    slotDuration: 30,
  });

  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
      };

      // Only include availability if editing mode is active
      if (isEdit) {
        updateData.available = profileData.available;
      }

      const { data } = await axios.post(
        backendUrl + "/api/doctor/update-profile",
        updateData,
        { headers: { dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.error(error);
    }
  };

  const to12Hour = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hours = ((h + 11) % 12) + 1; // convert 0–23 to 1–12
    return `${hours}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  const handleAddAvailability = () => {
    addAvailability(profileData._id, {
      ...newAvailability,
    });
    setNewAvailability({
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      slotDuration: 30,
    });
  };


  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  useEffect(() => {
    if (profileData?._id) getAvailability(profileData._id);
  }, [profileData]);

  return (
    profileData && (
      <div className="flex flex-col gap-4 m-5">
        {/* Doctor Image */}
        <div>
          <img
            className="bg-primary/80 w-full sm:max-w-64 rounded-lg"
            src={profileData.image}
            alt={profileData.name}
          />
        </div>

        {/* Doctor Info */}
        <div className="flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white">
          {/* ----- Doc Info : name, degree, experience ----- */}
          <p className="felx items-center gap-2 text-3xl font-medium text-gray-700">
            {profileData.name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <p>
              {profileData.degree} - {profileData.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {profileData.experience}
            </button>
          </div>
          <p className="gap-2 mt-1 text-neutral-600 ">
            Reg No: {profileData.reg_number}
          </p>

          {/* ----- Doc About ----- */}
          <div>
            <p className="felx items-center gap-1 text-sm font-medium text-neutral-800 mt-3">
              About:
            </p>
            <p className="text-sm text-gray-600 max-w-[700px] mt-1">
              {profileData.about}
            </p>
          </div>

          {/* ----- Appointment Fee ----- */}
          <p className="text-gray-600 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-800">
              {currency}{" "}
              {isEdit ? (
                <input
                  type="number"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      fees: e.target.value,
                    }))
                  }
                  value={profileData.fees}
                />
              ) : (
                profileData.fees
              )}
            </span>
          </p>

          {/* ----- Address ----- */}
          <div className="flex gap-2 py-2">
            <p>Address:</p>
            <p className="text-sm">
              {isEdit ? (
                <input
                  type="text"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value },
                    }))
                  }
                  value={profileData.address.line1}
                />
              ) : (
                profileData.address.line1
              )}
              <br />
              {isEdit ? (
                <input
                  type="text"
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value },
                    }))
                  }
                  value={profileData.address.line2}
                />
              ) : (
                profileData.address.line2
              )}
            </p>
          </div>

          {/* ----- Availability ----- */}
          <div className="flex gap-1 pt-2">
            <input
              disabled={!isEdit}
              onChange={() =>
                setProfileData((prev) => ({
                  ...prev,
                  available: !prev.available,
                }))
              }
              checked={profileData.available}
              type="checkbox"
              id="available"
              className="accent-blue-500"
            />

            <label htmlFor="available">Available</label>
          </div>

          {/* ----- Edit Button ----- */}
          {isEdit ? (
            <button
              onClick={updateProfile}
              className="px-6 py-2 bg-primary text-white text-sm rounded-full mt-5 hover:bg-opacity-90 transition-all duration-300 shadow-md"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEdit(true)}
              className="px-6 py-2 border border-primary text-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* ----- Availability Management Section ----- */}
        <div className="mt-4 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-primary text-lg" />
              <h3 className="font-semibold text-gray-800">Manage Working Hours</h3>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FiInfo /> Add multiple slots per day for split shifts
            </p>
          </div>

          <div className="p-6">
            {/* Add new availability form */}
            <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 mb-8">
              <p className="text-sm font-medium text-blue-800 mb-4 flex items-center gap-2">
                <FiPlus /> Add New Time Slot
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium ml-1">Working Day</label>
                  <select
                    className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={newAvailability.dayOfWeek}
                    onChange={(e) =>
                      setNewAvailability({
                        ...newAvailability,
                        dayOfWeek: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Day</option>
                    {[
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium ml-1">Start Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      className="w-full border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newAvailability.startTime}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium ml-1">End Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      className="w-full border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newAvailability.endTime}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium ml-1">Slot Duration (Min)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newAvailability.slotDuration}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          slotDuration: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => handleAddAvailability()}
                      className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                      disabled={
                        !newAvailability.dayOfWeek ||
                        !newAvailability.startTime ||
                        !newAvailability.endTime ||
                        !newAvailability.slotDuration ||
                        newAvailability.startTime >= newAvailability.endTime
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* List existing availabilities grouped by day */}
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-zinc-100 pb-2">Your Weekly Schedule</h4>
              
              {availabilities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {[
                    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
                  ].map((day) => {
                    const daySlots = availabilities.filter(a => a.dayOfWeek === day);
                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-zinc-100 hover:border-primary/20 hover:bg-blue-50/10 transition-all group">
                        <div className="md:w-32 flex items-center">
                          <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold tracking-wider group-hover:bg-primary group-hover:text-white transition-colors">
                            {day}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-wrap gap-3">
                          {daySlots.map((avail) => (
                            <div key={avail._id} className="flex items-center gap-3 bg-white border border-zinc-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <FiClock className="text-primary/60" />
                                <span>{to12Hour(avail.startTime)}</span>
                                <span className="text-gray-300">—</span>
                                <span>{to12Hour(avail.endTime)}</span>
                              </div>
                              <div className="h-4 w-[1px] bg-zinc-200 mx-1"></div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  className="w-12 text-center text-xs border-none bg-zinc-50 rounded py-1 focus:ring-1 focus:ring-primary/30 outline-none"
                                  value={avail.slotDuration}
                                  onChange={(e) =>
                                    updateAvailability(profileData._id, avail._id, {
                                      ...avail,
                                      slotDuration: e.target.value,
                                    })
                                  }
                                />
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Min</span>
                              </div>
                              <button
                                onClick={() => deleteAvailability(profileData._id, avail._id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                title="Delete Slot"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-zinc-200">
                  <FiClock className="text-zinc-300 text-4xl mb-3" />
                  <p className="text-gray-400 font-medium">No working hours scheduled</p>
                  <p className="text-gray-400 text-xs">Add your availability above to start receiving bookings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;
