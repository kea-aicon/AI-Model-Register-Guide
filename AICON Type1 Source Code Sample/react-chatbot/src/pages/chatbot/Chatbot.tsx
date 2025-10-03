import React, { useState, useRef, useEffect } from "react";
import ChatService from "../../services/ChatService";
import ReactMarkdown from "react-markdown";
import "./Chatbot.css";

const Chatbot: React.FC<{ heartRate?: string }> = ({ heartRate }) => {
  const chatContentRef = useRef<HTMLDivElement>(null);

  const [messageInput, setMessageInput] = useState("");
  const [messageOutputAll, setMessageOutputAll] = useState<string[]>([]);
  const [selectedFilesList, setSelectedFilesList] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<{ name: string, blob: Blob, url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const shouldScroll = useRef(true);

  useEffect(() => {
    if (heartRate) {
      const initialMessage = `My heart rate is ${heartRate} bpm, advise me.`;
      sendMessage(initialMessage);
    }
  }, []);

  useEffect(() => {
    if (shouldScroll.current) scrollToBottom();
  }, [messageOutputAll]);

  const callChatbot = () => {
    if (messageInput.trim() === "" && selectedFilesList.length === 0) 
      return;

    //Case has files
    if (selectedFilesList.length) {
      uploadFile(messageInput);
      setSelectedFilesList([]);
    } 
    else {
      sendMessage(messageInput);
    }

    setMessageInput("");
    shouldScroll.current = true;
  };

  //Call API AI chatbot
  const sendMessage = async (msg: string) => {
    setIsLoading(true);
    setMessageOutputAll(prev => [...prev, msg]);
    try {
      //Call api and get response
      const resp = await ChatService.sendMessage(msg);
      //Show result for the screen
      setMessageOutputAll(prev => [...prev, resp]);
    } catch (err) {
      console.error(err);
      setMessageOutputAll(prev => [...prev, "There is an error occured. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  //Handler file
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFilesList(prev => [...prev, file]);
    e.target.value = "";
  };

  //Call API AI chatbot and send files
  const uploadFile = async (msg: string) => {
    setIsLoading(true);
    setMessageOutputAll(prev => [...prev, msg]);
    try {
      //Call api and get response
      const blob = await ChatService.uploadFilesAndSendMessage(msg, selectedFilesList as unknown as FileList);
      const fileName = "file_processed";
      const url = URL.createObjectURL(blob);
      //Handler response
      setProcessedFiles(prev => [...prev, { name: fileName, blob, url }]);
      //Show result for the screen
      setMessageOutputAll(prev => [...prev, `Your file processed successful. Download [${fileName}](#)`]);
    } catch (err) {
      console.error(err);
      setMessageOutputAll(prev => [...prev, "There is an error occured. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  //Auto scroll to bottom
  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-title">Can I help you in anyway?</div>
      <div className="chat-container">
        <div className="chat-content-container" ref={chatContentRef}>
          {messageOutputAll.map((msg, i) => (
            <div key={i} className="chat-messages">
              <ReactMarkdown className={`message ${i % 2 === 0 ? "sent" : "received"}`}>
                {msg}
              </ReactMarkdown>
            </div>
          ))}
          {isLoading && (
            <div className="loading">
              <div className="spinner"><span /></div>
            </div>
          )}
        </div>

        <div className="chat-group">
          <input
            type="text"
            className="chat-input"
            id="chatMessage"
            name="chatMessage"
            placeholder="Enter your question"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && callChatbot()}
          />

          <button className="upload-button" disabled={isLoading} onClick={() => document.getElementById("file-input")?.click()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
              <path d="M13 7.47266H11V11.4727H7V13.4727H11V17.4727H13V13.4727H17V11.4727H13V7.47266ZM12 2.47266C6.48 2.47266 2 6.95266 2 12.4727C2 17.9927 6.48 22.4727 12 22.4727C17.52 22.4727 22 17.9927 22 12.4727C22 6.95266 17.52 2.47266 12 2.47266ZM12 20.4727C7.59 20.4727 4 16.8827 4 12.4727C4 8.06266 7.59 4.47266 12 4.47266C16.41 4.47266 20 8.06266 20 12.4727C20 16.8827 16.41 20.4727 12 20.4727Z"
                fill="#8E9296" />
            </svg>
          </button>

          <ul className="file-list">
            {selectedFilesList.map((file, i) => (
              <li key={i} className="file-name">{file.name}</li>
            ))}
          </ul>

          <input type="file" className="select-file" id="file-input" onChange={onFileSelected} />

          <button className="send-button" disabled={isLoading || messageInput.length === 0} onClick={callChatbot}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
              <path d="M4 12.4727L5.41 13.8827L11 8.30266V20.4727H13V8.30266L18.58 13.8927L20 12.4727L12 4.47266L4 12.4727Z"
                fill="#B1B5BA" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
