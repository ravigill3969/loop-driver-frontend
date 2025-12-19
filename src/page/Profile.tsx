import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/userContext";
import { User, Car, Phone, Mail, CreditCard, Hash } from "lucide-react";

function Profile() {
  const { user, driver_details } = useAuth();

  if (!user || !driver_details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.full_name}
                </h1>
                <p className="text-gray-500">Driver Profile</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="text-gray-900 mt-1">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <p className="text-gray-900 mt-1">{user.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    User ID
                  </label>
                  <p className="text-gray-900 mt-1 font-mono text-sm">
                    {user.user_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver License Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                License Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    License Number
                  </label>
                  <p className="text-gray-900 mt-1 font-mono">
                    {driver_details.license_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    License Plate
                  </label>
                  <p className="text-gray-900 mt-1 font-mono text-lg font-bold">
                    {driver_details.license_plate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Contact Number
                  </label>
                  <p className="text-gray-900 mt-1">
                    {driver_details.phone_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-blue-600" />
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Vehicle Type
                  </label>
                  <p className="text-gray-900 mt-1 capitalize">
                    {driver_details.vehicle_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Make
                  </label>
                  <p className="text-gray-900 mt-1">
                    {driver_details.vehicle_make}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Model
                  </label>
                  <p className="text-gray-900 mt-1">
                    {driver_details.vehicle_model}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Color
                  </label>
                  <div className="flex items-center mt-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2"
                      style={{
                        backgroundColor:
                          driver_details.vehicle_color.toLowerCase(),
                      }}
                    ></div>
                    <p className="text-gray-900 capitalize">
                      {driver_details.vehicle_color}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
