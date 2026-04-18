import { useState } from "react";
import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : "",
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);

  // ----------------- Appointments -----------------
  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { dToken },
        },
      );
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/appointment-complete",
        { appointmentId },
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/appointment-cancel",
        { appointmentId },
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- Dashboard -----------------
  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { dToken },
      });
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- Profile -----------------
  const getProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/profile", {
        headers: { dToken },
      });
      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- Availability -----------------
  const getAvailability = async (doctorId) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/${doctorId}/availability`,
        { headers: { dToken } },
      );
      if (data.success) {
        setAvailabilities(data.availabilities);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addAvailability = async (doctorId, newAvailability) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/${doctorId}/availability`,
        newAvailability,
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success("Availability added");
        getAvailability(doctorId);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateAvailability = async (doctorId, id, updated) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/doctor/${doctorId}/availability/${id}`,
        updated,
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success("Availability updated");
        getAvailability(doctorId);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteAvailability = async (doctorId, id) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/doctor/${doctorId}/availability/${id}`,
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success("Availability deleted");
        getAvailability(doctorId);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ----------------- Context Value -----------------
  const value = {
    backendUrl,
    dToken,
    setDToken,
    appointments,
    setAppointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    setDashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData,
    availabilities,
    getAvailability,
    addAvailability,
    updateAvailability,
    deleteAvailability,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
