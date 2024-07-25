import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEmail } from "react-icons/md";
import { SlArrowDown } from "react-icons/sl";
import { BsFillCameraFill } from "react-icons/bs";
import { useDropzone } from "react-dropzone";
import { fetchProfile, updateProfile } from "../../redux/feature/user/UserSlice";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import ContentLoader from "react-content-loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAccessToken } from "../../lib/secureLocalStorage";

const MyLoader = () => (
  <ContentLoader viewBox="0 0 380 70">
    <rect x="0" y="0" rx="5" ry="5" width="70" height="70" />
    <rect x="80" y="17" rx="4" ry="4" width="300" height="13" />
    <rect x="80" y="40" rx="3" ry="3" width="250" height="10" />
  </ContentLoader>
);

const validationSchema = Yup.object({
  first_name: Yup.string().required("First Name is required"),
  last_name: Yup.string().required("Last Name is required"),
});

function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, status, error } = useSelector((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar);
    }
  }, [profile]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSelect = (gender, setFieldValue) => {
    setFieldValue("gender", gender);
    setShowDropdown(false);
  };

  const validateFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG and GIF are allowed.");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File size is too large. Maximum size allowed is 2MB.");
      return false;
    }

    return true;
  };

  const uploadFile = async (file) => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (!validateFile(file)) return;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${getAccessToken()}`); // Use getAccessToken to get the current access token

    const formdata = new FormData();
    formdata.append("file", file, file.name);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}upload/`,
        requestOptions
      );
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      const result = await response.json();
      setAvatar(result.url);
    } catch (error) {
      toast.error(`Upload error: ${error.toString()}`);
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      uploadFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".gif"] },
  });

  const handleSave = async (values, { setSubmitting }) => {
    const formData = new FormData();
    for (const key in values) {
      formData.append(key, values[key]);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success("Profile updated successfully!");
      dispatch(fetchProfile()); // Trigger re-fetch of the profile
    } catch (err) {
      toast.error(`Failed to update profile: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-3xl p-8 bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-auto">
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative group" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="w-24 h-24 rounded-full bg-gray-300 flex justify-center items-center">
                <p>Drop image here...</p>
              </div>
            ) : (
              <img
                className="w-24 h-24 rounded-full object-cover"
                src={
                  avatar ||
                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                }
                alt="Profile"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <BsFillCameraFill className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
              {profile ? profile.username : ""}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {profile ? profile.email : ""}
            </p>
          </div>
        </div>

        {status === "loading" && <MyLoader />}
        {status === "failed" && <p className="text-red-500">{error}</p>}
        {status === "succeeded" && profile && (
          <Formik
            initialValues={{
              first_name: profile.first_name || "",
              last_name: profile.last_name || "",
              gender: profile.gender || "",
              phone_number: profile.phone_number || "",
              dob: profile.dob || "",
              username: profile.username || "",
              address: profile.address || "",
              bio: profile.bio || "",
              facebook: profile.facebook || "",
              twitter: profile.twitter || "",
              instagram: profile.instagram || "",
              linkedin: profile.linkedin || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSave}
          >
            {({ setFieldValue }) => (
              <Form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    First Name
                  </label>
                  <Field
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="first_name"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Last Name
                  </label>
                  <Field
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="last_name"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Gender
                  </label>
                  <Field
                    type="text"
                    name="gender"
                    placeholder="Select Gender"
                    readOnly
                    onClick={toggleDropdown}
                    className="block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer"
                  />
                  <SlArrowDown
                    className="absolute right-3 top-8 text-gray-500 cursor-pointer"
                    onClick={toggleDropdown}
                  />
                  {showDropdown && (
                    <div className="absolute z-10 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg w-full">
                      <div
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSelect("M", setFieldValue)}
                      >
                        Male
                      </div>
                      <div
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSelect("F", setFieldValue)}
                      >
                        Female
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Contact Number
                  </label>
                  <Field
                    type="text"
                    name="phone_number"
                    placeholder="Your Contact Number"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Date of Birth
                  </label>
                  <Field
                    type="date"
                    name="dob"
                    placeholder="Your Date of Birth"
                    className="date-input mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Username
                  </label>
                  <Field
                    type="text"
                    name="username"
                    placeholder="Your Username"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Address
                  </label>
                  <Field
                    type="text"
                    name="address"
                    placeholder="Your Address"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Bio
                  </label>
                  <Field
                    as="textarea"
                    name="bio"
                    placeholder="Write something about yourself"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Facebook
                  </label>
                  <Field
                    type="url"
                    name="facebook"
                    placeholder="Your Facebook Profile Link"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Twitter
                  </label>
                  <Field
                    type="url"
                    name="twitter"
                    placeholder="Your Twitter Profile Link"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Instagram
                  </label>
                  <Field
                    type="url"
                    name="instagram"
                    placeholder="Your Instagram Profile Link"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    LinkedIn
                  </label>
                  <Field
                    type="url"
                    name="linkedin"
                    placeholder="Your LinkedIn Profile Link"
                    className="mt-1 block w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}

export default EditProfile;
