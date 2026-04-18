import { createContext } from "react";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currency = '₹'

     const calculateAge = (dob) => {
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        return age
    }

    const months = [" ", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


    const slotDateFormat = (slotDate) => {
      const dateArray = slotDate.split('_')
      return dateArray[0]+ " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const formatOrderDate = (isoString) => {
      if (!isoString) return "";
    
      const date = new Date(isoString);
    
      // Example: 05 Apr 2026, 02:08 PM
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };


    const value = {
       calculateAge,
       slotDateFormat,
       currency,
       formatOrderDate
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider