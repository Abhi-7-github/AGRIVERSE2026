import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPublicSettings } from '../api/client';

const defaultEventData = {
  registrationOpen: true,
  isSystemOpen: true,
  isFull: false,
  registrationLimit: 100,
  registeredTeams: 0,
  remainingSlots: 100,
  progressPercent: 0,
  registrationFee: 0,
  qrCode: null,
  qrCodes: [],
  whatsappGroups: [],
};

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [eventData, setEventData] = useState(defaultEventData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEventData = useCallback(async () => {
    try {
      setError(null);
      const res = await getPublicSettings();
      if (res && res.success && res.event) {
        setEventData(res.event);
        return res.event;
      }
    } catch (err) {
      // Silently keep default data without blocking the UI
      setError(err.response?.data?.message || 'Offline');
    }
    return null;
  }, []);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  return (
    <EventContext.Provider
      value={{
        eventData: eventData || defaultEventData,
        loading,
        error,
        refreshEvent: fetchEventData,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
export default EventContext;
