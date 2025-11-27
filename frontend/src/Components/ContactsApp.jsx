import { useState, useEffect } from "react";
import axios from "axios";
import ContactsCardsContainer from "./ContactsCardsContainer";
import ContactForm from "./ContactForm";
import "../App.css";

import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";


export default function ContactsApp() {
  const [currentUser, setCurrentUser] = useState(() => {
    const jwtToken = Cookies.get("jwt-authorization");
    if (!jwtToken) return ""; // No token found
    // Decode token to get username info
    try {
      const decodedToken = jwtDecode(jwtToken);
      return decodedToken.username || "";
    } catch {
      return "";
    }
  });

  const navigate = useNavigate();

  //Verify JWT on component mount and redirect if invalid
  useEffect(() => {
    const jwtToken = Cookies.get("jwt-authorization"); // Get JWT from cookies

    if (!jwtToken) {
      navigate("/login");
      return;
    }

    try {
      jwtDecode(jwtToken); // Try decoding the token
      // If decoding is successful, token is valid
    } catch (error) {
      console.error("Invalid JWT", error); // Log error for debugging
      // Redirect to login if token is invalid
      navigate("/login");
    }
  }, [navigate]); // Empty dependency array ensures this runs only once on mount

  const handleLogout = () => {
    Cookies.remove("jwt-authorization");
    setCurrentUser("");
    navigate("/login");
  };


  //States
  const [contactsData, setContactsData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    image: "",
  });
  const [postResponse, setPostResponse] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  //useEffect
  useEffect(() => {
    handleContactsDB();
  }, [postResponse]);

  //Handlers
  //GET Data from DB handler
  const handleContactsDB = async () => {
    try {
      const response = await axios.get("http://localhost:3000/contacts");
      // console.log(response);
      setContactsData(() => response.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  //Handle to reset the form
  const handleResetForm = () => {
    setFormData({
      name: "",
      email: "",
      address: "",
      phone: "",
      image: "",
    });
  };

  //Handle the submission of data
  const handleOnSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        handleOnUpdate(formData._id);
        handleResetForm();
        setIsEditing(false);
      } else {
        await axios
          .post("http://localhost:3000/contacts", formData)
          .then((response) => {
            setPostResponse(response.data);
            console.log(response);
          })
          .then(() => handleResetForm());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  //Handle the onChange event for the form
  const handleOnChange = (e) => {
    setFormData((prevData) => {
      return { ...prevData, [e.target.name]: e.target.value };
    });
  };

  //Handle to delete on contact by id
  const handleOnDelete = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:3000/contacts/${id}`
      );
      setPostResponse(response.data);
      console.log(response);
    } catch (error) {
      console.log(error.message);
    }
  };

  //Handle the edition of one contact by its id
  const handleOnEdit = async (id) => {
    try {
      const contactToEdit = await axios.get(
        `http://localhost:3000/contacts/${id}`
      );
      console.log(contactToEdit);
      setFormData({
        name: contactToEdit.data.name,
        phone: contactToEdit.data.contact.phone,
        email: contactToEdit.data.contact.email,
        address: contactToEdit.data.contact.address,
        image: contactToEdit.data.image,
        _id: contactToEdit.data._id,
      });
      setIsEditing(true);
    } catch (error) {
      console.log(error);
    }
  };

  //Handle updating the api patch route
  const handleOnUpdate = async (id) => {
    try {
      const result = await axios.patch(
        `http://localhost:3000/contacts/${id}`,
        formData
      );
      setPostResponse({ message: result.data.message, date: result.data.date });
    } catch (error) {
      console.log(error);
    }
  };

  //Render
  return (
    <div>
      <div className="welcome">
        <span>Welcome {currentUser}</span>
        <button onClick={() => handleLogout()}>Logout</button>
      </div>
      <ContactForm
        name={formData.name}
        email={formData.email}
        address={formData.address}
        phone={formData.phone}
        image={formData.image}
        handleOnSubmit={handleOnSubmit}
        handleOnChange={handleOnChange}
        isEditing={isEditing}
      />
      <p style={{ color: "green" }}>{postResponse?.message}</p>
      <ContactsCardsContainer
        contacts={contactsData}
        handleOnDelete={handleOnDelete}
        handleOnEdit={handleOnEdit}
      />
    </div>
  );
}
