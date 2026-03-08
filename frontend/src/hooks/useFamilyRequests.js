// src/hooks/useFamilyRequests.js
import { useState, useEffect } from "react";
import api from "../lib/axios";

export const useFamilyRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [processing, setProcessing] = useState(false);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get("/api/family/request/pending");
      setPendingRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await api.get("/api/family/request/sent");
      setSentRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch sent requests:", err);
    }
  };

  const sendRequest = async (payload) => {
    setProcessing(true);
    try {
      await api.post("/api/family/request/send", payload);
      await fetchSentRequests();
      return { success: true, message: "Family request sent successfully!" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send request",
      };
    } finally {
      setProcessing(false);
    }
  };

  const acceptRequest = async (requestId) => {
    setProcessing(true);
    try {
      const res = await api.post(
        `/api/family/request/${requestId}/accept`
      );
      await fetchPendingRequests();
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to accept request",
      };
    } finally {
      setProcessing(false);
    }
  };

  const declineRequest = async (requestId) => {
    setProcessing(true);
    try {
      await api.post(`/api/family/request/${requestId}/decline`);
      await fetchPendingRequests();
      return { success: true, message: "Family request declined" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to decline request",
      };
    } finally {
      setProcessing(false);
    }
  };

  const cancelRequest = async (requestId) => {
    setProcessing(true);
    try {
      await api.delete(`/api/family/request/${requestId}/cancel`);
      await fetchSentRequests();
      return { success: true, message: "Request cancelled" };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to cancel request",
      };
    } finally {
      setProcessing(false);
    }
  };

  const removeFamily = async (memberId, relationType) => {
    setProcessing(true);
    try {
      const res = await api.post("/api/family/remove", {
        memberId,
        relation: relationType,
      });
      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to remove",
      };
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  return {
    pendingRequests,
    sentRequests,
    processing,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFamily,
  };
};
