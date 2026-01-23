// src/components/FamilyRequestNotifications.jsx
import React from "react";

const FamilyRequestNotifications = ({
  pendingRequests,
  sentRequests,
  onAccept,
  onDecline,
  onCancel,
  processing,
}) => {
  return (
    <div className="mb-6 p-5 rounded-2xl bg-white shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Family Requests</h3>

      {/* Received Requests */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Received Requests ({pendingRequests.length})
        </h4>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {request.sender.username}
                    </p>
                    <p className="text-sm text-gray-600">
                      wants to add you as their{" "}
                      <span className="font-semibold">{request.relation}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.sender.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(request._id)}
                      disabled={processing}
                      className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDecline(request._id)}
                      disabled={processing}
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Sent Requests ({sentRequests.length})
        </h4>
        {sentRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No sent requests</p>
        ) : (
          <div className="space-y-3">
            {sentRequests.map((request) => (
              <div
                key={request._id}
                className="p-4 rounded-lg border border-gray-200 bg-blue-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {request.receiver.username}
                    </p>
                    <p className="text-sm text-gray-600">
                      Pending request as{" "}
                      <span className="font-semibold">{request.relation}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.receiver.email}
                    </p>
                  </div>
                  <button
                    onClick={() => onCancel(request._id)}
                    disabled={processing}
                    className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyRequestNotifications;
