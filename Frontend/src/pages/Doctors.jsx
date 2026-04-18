import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { FiSearch } from "react-icons/fi"; 
import { assets } from "../assets/assets";

const Doctors = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  const applyFilter = () => {
  let filtered = speciality
    ? doctors.filter((doc) => doc.speciality === speciality)
    : doctors;

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((doc) =>
      (doc.name && doc.name.toLowerCase().includes(term)) ||
      (doc.speciality && doc.speciality.toLowerCase().includes(term)) ||
      (doc.city && doc.city.toLowerCase().includes(term))
    );
  }

  filtered.sort((a, b) => Number(b.available) - Number(a.available));
  setFilterDoc(filtered);
};


  useEffect(() => {
    applyFilter();
  }, [doctors, speciality, searchTerm]);

  return (
    <div>
      {/* Header row with text + search box */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">Browse through the doctors speciality.</p>

        {/* Search Box aligned right */}
        <div className="relative w-64">
          {" "}
          {/* medium width */}
          <input
            type="text"
            placeholder="Search by name or speciality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pr-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
          {/* React Icon inside box */}
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${
            showFilter ? "bg-primary" : ""
          }`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>

        {/* Speciality Filters */}
        <div
          className={`flex-col gap-4 text-sm text-gray-600 ${
            showFilter ? "flex" : "hidden sm:flex"
          }`}
        >
          {[
            "General physician",
            "Gynecologist",
            "Dermatologist",
            "Pediatrician",
            "Neurologist",
            "Gastroenterologist",
          ].map((spec) => (
            <p
              key={spec}
              onClick={() =>
                speciality === spec
                  ? navigate("/doctors")
                  : navigate(`/doctors/${spec}`)
              }
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                speciality === spec ? "bg-indigo-100" : ""
              }`}
            >
              {spec}
            </p>
          ))}
        </div>

        {/* Doctors Grid */}
        <div className="w-full grid grid-cols-auto gap-4 gap-y-6">
          {filterDoc.map((item, index) => (
            <div
              onClick={() =>
                item.available && navigate(`/appointment/${item._id}`)
              }
              className={`border border-blue-200 rounded-xl overflow-hidden transition-all duration-500 ${
                item.available
                  ? "cursor-pointer hover:translate-y-[-10px]"
                  : "opacity-50 cursor-not-allowed"
              }`}
              key={index}
            >
              <img className="bg-blue-50" src={item.image} alt={item.name} />
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-center">
                  {item.available ? (
                    <>
                      <p className="w-2 h-2 bg-green-500 rounded-full"></p>
                      <p className="text-green-500">Available</p>
                    </>
                  ) : (
                    <>
                      <p className="w-2 h-2 bg-red-500 rounded-full"></p>
                      <p className="text-red-500">Unavailable</p>
                    </>
                  )}
                </div>
                <div className="text-start">
                  <p className="text-gray-900 text-lg font-medium">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-sm">{item.speciality}</p>
                  <p className="flex justify-start items-center gap-1 text-gray-500 text-sm pt-1">
                    <img
                      className="w-4 h-4"
                      src={assets.pinlocation_icon}
                      alt="location"
                    />
                    <span>{item.city}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
