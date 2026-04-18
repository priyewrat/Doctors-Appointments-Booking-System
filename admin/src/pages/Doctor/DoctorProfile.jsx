import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

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
    ...newAvailability, // keep "08:33", "13:24"
  });
  setNewAvailability({ dayOfWeek: "", startTime: "", endTime: "", slotDuration: 30 });
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
              className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all duration-300"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEdit(true)}
              className="px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all duration-300"
            >
              Edit
            </button>
          )}
        </div>
        {/* ----- Availability Management Section ----- */}
        <div className="mt-6 border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="font-medium text-gray-800">Manage Availability</h3>

          {/* Add new availability */}
          <div className="flex gap-2 mt-2">
            <select
              value={newAvailability.dayOfWeek}
              onChange={(e) =>
                setNewAvailability({
                  ...newAvailability,
                  dayOfWeek: e.target.value,
                })
              }
            >
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
            <input
              type="time"
              value={newAvailability.startTime}
              onChange={(e) =>
                setNewAvailability({
                  ...newAvailability,
                  startTime: e.target.value,
                })
              }
            />
            <input
              type="time"
              value={newAvailability.endTime}
              onChange={(e) =>
                setNewAvailability({
                  ...newAvailability,
                  endTime: e.target.value,
                })
              }
            />
            <input
              type="number"
              min="5"
              step="5"
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
              className="px-3 py-1 bg-primary text-white rounded"
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

          {/* List existing availabilities */}
          <ul className="mt-4">
            {availabilities.map((avail) => (
              <li
                key={avail._id}
                className="flex justify-between items-center border border-gray-300 p-2 rounded"
              >
                <span>
                  {avail.dayOfWeek} {to12Hour(avail.startTime)} -{" "}
                  {to12Hour(avail.endTime)} ({avail.slotDuration} mins)
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={avail.slotDuration}
                    onChange={(e) =>
                      updateAvailability(profileData._id, avail._id, {
                        ...avail,
                        slotDuration: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() =>
                      deleteAvailability(profileData._id, avail._id)
                    }
                    className="px-2 py-1 border rounded text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;
