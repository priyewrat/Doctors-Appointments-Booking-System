import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";
import { useLocation } from "react-router-dom";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } =
    useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const navigate = useNavigate();
  const location = useLocation();

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Helper: convert 24h string to 12h AM/PM
  const to12Hour = (time24) => {
    if (!time24 || !time24.includes(":")) return "";
    const [h, m] = time24.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return "";
    const suffix = h >= 12 ? "PM" : "AM";
    const hours = ((h + 11) % 12) + 1;
    return `${hours}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  const fetchDocInfo = async () => {
    const docInfo = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const getAvailableSlots = async () => {
    try {
      setLoadingSlots(true); // start loading
      const today = new Date();
      let slotsByDay = [];

      // fetch slots for the next 7 days
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        const dateString = currentDate.toISOString().split("T")[0];

        const { data } = await axios.get(
          `${backendUrl}/api/doctor/${docId}/slots`,
          { params: { date: dateString } },
        );

        const now = new Date();

        const timeSlots = (data.slots || [])
          .map((time) => {
            const slotDateTime = new Date(`${dateString}T${time}`);
            return { datetime: slotDateTime, time };
          })
          .filter((slot) => {
            if (dateString === now.toISOString().split("T")[0]) {
              return slot.datetime > now;
            }
            return true;
          })
          .sort((a, b) => a.datetime - b.datetime);

        slotsByDay.push(timeSlots);
      }

      setDocSlots(slotsByDay);
    } catch (error) {
      toast.error("Error fetching slots");
    } finally {
      setLoadingSlots(false); // stop loading
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book Appointment");
      return navigate("/login", { state: { from: location } });
    }

    try {
      const date = docSlots[slotIndex][0].datetime;
      const slotDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { docId, slotDate, slotTime },
        { headers: { token } },
      );

      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [docId, doctors]);

  useEffect(() => {
    if (docInfo) getAvailableSlots();
  }, [docInfo]);

  return (
    docInfo && (
      <div>
        {/* ----------- Doctor Details ---------- */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg"
              src={docInfo.image}
              alt=""
            />
          </div>

          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} alt="" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.about}
              </p>
            </div>
            <p className="text-gray-500 font-medium mt-4">
              Appointment fee:{" "}
              <span className="text-gray-600">
                {currencySymbol}
                {docInfo.fees}
              </span>
            </p>
            <div className="mt-4">
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
                Address
                <img className="w-5" src={assets.location_icon} alt="" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.address?.line1}, {docInfo.address?.line2}
              </p>
            </div>
          </div>
        </div>

        {/* ----------- Booking Slots ---------- */}
        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking Slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {loadingSlots ? (
              ""
            ) : docSlots.length ? (
              docSlots.map((item, index) => (
                <div
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                    item.length
                      ? slotIndex === index
                        ? "bg-primary text-white"
                        : "border border-gray-200"
                      : slotIndex === index
                        ? "bg-gray-500 text-white"
                        : "border border-gray-200 text-gray-400"
                  }`}
                  key={index}
                >
                  {item.length ? (
                    <>
                      <p>{daysOfWeek[item[0].datetime.getDay()]}</p>
                      <p>{item[0].datetime.getDate()}</p>
                    </>
                  ) : (
                    <p className="text-xs">No slots</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No slots available</p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
            {loadingSlots ? (
              <p className="text-gray-400">Loading slots...</p>
            ) : docSlots.length && docSlots[slotIndex].length ? (
              docSlots[slotIndex].map((item, index) => (
                <p
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                    item.time === slotTime
                      ? "bg-primary text-white"
                      : "text-gray-400 border border-gray-300"
                  }`}
                  key={index}
                >
                  {to12Hour(item.time)}
                </p>
              ))
            ) : (
              <p className="text-gray-400">No slots available</p>
            )}
          </div>

          <button
            onClick={bookAppointment}
            className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 hover:bg-primary/80 hover:shadow-md cursor-pointer"
          >
            Book an appointment
          </button>
        </div>

        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
