import React, { useEffect, useState } from "react";
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";

const agentId = "f7d0031562b20fd083d4892053545288";

interface RegisterCallResponse {
  call_response?: {
    call_id?: string,
  }
}

const webClient = new RetellWebClient();

const App = () => {
  const [isCalling, setIsCalling] = useState(false);

  // Initialize the SDK
  useEffect(() => {
    // Setup event listeners
    webClient.on("conversationStarted", () => {
      console.log("conversationStarted");
    });

    webClient.on("audio", (audio: Uint8Array) => {
      console.log("There is audio");
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Closed with code:", code, ", reason:", reason);
      setIsCalling(false); // Update button to "Start" when conversation ends
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      setIsCalling(false); // Update button to "Start" in case of error
    });

    webClient.on("update", (update) => {
      // Print live transcript as needed
      console.log("update", update);
    });
  }, []);

  const toggleConversation = async () => {
    if (isCalling) {
      webClient.stopConversation();
    } else {
      const registerCallResponse = await registerCall(agentId);
      console.log(registerCallResponse.call_response)
      console.log(registerCallResponse.call_response?.call_id)
      if (registerCallResponse.call_response &&
        registerCallResponse.call_response.call_id) {
          console.log('Inside')
        webClient
          .startConversation({
            callId: registerCallResponse.call_response.call_id,
            sampleRate: registerCallResponse.call_response.sample_rate,
            enableUpdate: true,
          })
          .catch(console.error);
        setIsCalling(true); // Update button to "Stop" when conversation starts
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      // Replace with your server url
      const response = await fetch(
        "http://localhost:8080/register-call-on-your-server",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            sample_rate: 8000
          }),
        },
      );
      console.log('here1')

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      console.log('here2')
      console.log(response)
      const data: RegisterCallResponse = await response.json();
      console.log('here3')
      console.log(data)
      return data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={toggleConversation}>
          {isCalling ? "Stop" : "Start"}
        </button>
      </header>
    </div>
  );
};

export default App;
