import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jiraLogo from './image.png'; // Make sure to add this image to your project
import './JetBrainsMono-Medium.woff2'; // Import the JetBrains Mono font

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        try {
          const response = await axios.post(
            'http://localhost:8000/api/process_audio',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
          setResponse(response.data);
        } catch (error) {
          console.error('Error sending audio to server:', error);
        }
      };
    }
  };

  useEffect(() => {
    const createJiraLogo = () => {
      const logo = document.createElement('img');
      logo.src = jiraLogo;
      logo.style.position = 'absolute';
      logo.style.opacity = '0.5';
      logo.style.width = '50px';
      logo.style.height = 'auto';
      logo.style.left = `${Math.random() * 100}vw`;
      logo.style.top = `${Math.random() * 100}vh`;
      logo.style.transition = 'all 10s linear';
      document.body.appendChild(logo);

      setTimeout(() => {
        logo.style.left = `${Math.random() * 100}vw`;
        logo.style.top = `${Math.random() * 100}vh`;
      }, 100);

      setTimeout(() => {
        document.body.removeChild(logo);
      }, 10000);
    };

    const interval = setInterval(createJiraLogo, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        backgroundColor: 'black',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 1 }}>
        I am the Jira demo god. Ask me anything
      </h1>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          fontSize: '1.5rem',
          padding: '1rem 2rem',
          borderRadius: '2rem',
          border: 'none',
          backgroundColor: isRecording ? 'red' : '#39FF14', // Neon green color
          color: 'black',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          zIndex: 1,
          fontFamily: 'inherit',
        }}
      >
        {isRecording ? 'Show me how' : 'Get Demo NOW'}
      </button>
      {response && (
        <div style={{ marginTop: '2rem', maxWidth: '80%', zIndex: 1 }}>
          <h3>Agent Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default App;
