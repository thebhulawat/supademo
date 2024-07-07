import os
from dotenv import load_dotenv
from pydub import AudioSegment
from pydub.playback import play

from deepgram import (
    DeepgramClient,
    SpeakOptions,
)

load_dotenv()

SPEAK_OPTIONS = {"text": "Hello, how can I help you today?"}
filename = "output.wav"


def main():
    try:
        # STEP 1: Create a Deepgram client using the API key from environment variables
        deepgram = DeepgramClient(api_key='ccd39542915e20239233dbb9fb50732cffc5bf3d')

        # STEP 2: Configure the options (such as model choice, audio configuration, etc.)
        options = SpeakOptions(
            model="aura-asteria-en",
            encoding="linear16",
            container="wav"
        )

        # STEP 3: Call the save method on the speak property
        response = deepgram.speak.v("1").save(filename, SPEAK_OPTIONS, options)
        print(response.to_json(indent=4))
        audio = AudioSegment.from_wav(filename)
        play(audio)

    except Exception as e:
        print(f"Exception: {e}")


if __name__ == "__main__":
    main()