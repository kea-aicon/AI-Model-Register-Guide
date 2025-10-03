import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
//Import image
import iconHome from "../../assets/images/home.svg"

const Home: React.FC = () => {
  const navigate = useNavigate();

  /**
   * navigate to chatbot screen
  */
  const actionChatbot = () => {
    navigate("/chatbot");
  }
  return (
    <div className="home-page">
      <img src={iconHome} alt="Home" className="home-image" />
      <div className="home-title">
        Welcome to Awesome AI Chatbot
      </div>
      <div className="home-content">
        An AI chatbot is a software application powered by artificial intelligence, designed to
        simulate human-like
        conversations with users. Leveraging advanced natural language processing (NLP) and machine learning, it
        understands and responds to text or voice inputs in real time. AI chatbots are widely used in customer service,
        e-commerce, and IT support to automate tasks, provide instant responses, and enhance user experience. With
        continuous learning capabilities, they adapt to user preferences and improve interaction quality over time,
        making them essential tools in modern digital ecosystems.
      </div>
      <div className="button-container">
        <button className="button-start" onClick={actionChatbot}>
          Start Chat
        </button>
      </div>
    </div>
  );
};

export default Home;
