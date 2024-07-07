import os
from dotenv import load_dotenv
import google.generativeai as genai 
from IPython.display import Video
from IPython.display import Image
from prompt import train_prompt
import json
import time
from google.api_core.exceptions import FailedPrecondition, ResourceExhausted

script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '../.env.local')
load_dotenv(env_path)

load_dotenv('../.env.local')

api_key = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=api_key)

# Get all video files in the data directory
video_files = [f for f in os.listdir('./data') if f.endswith('.mov')]

uploaded_files = []

# Upload all video files
for video_file in video_files:
    print(f'Uploading file: {video_file}')
    data_file = genai.upload_file(path=f'./data/{video_file}', display_name=video_file, mime_type='video/mov')
    uploaded_files.append({
        'name': data_file.name,
        'display_name': data_file.display_name
    })
    print(f'Done uploading file: {video_file}')
print(uploaded_files)

model = genai.GenerativeModel(model_name='models/gemini-1.5-pro')
model_outputs = {}

# Generate content for all uploaded files
for uploaded_file in uploaded_files:
    # exponential backoff for gemnin 
    retries = 0
    while True:
        try:
            file = genai.get_file(name=uploaded_file['name'])
            print(f'Calling LLM for file: {file.display_name}')
            response = model.generate_content([train_prompt, file])
            if response and response.text:
                try:
                    # Remove triple quotes and 'json' keyword
                    cleaned_response = response.text.replace("```", "").replace("json", "").strip()
                    print(cleaned_response)
                    response_json = json.loads(cleaned_response)
                    model_outputs[uploaded_file['display_name']] = response_json
                    print(f'Done calling language model for the file: {file.display_name}')
                    break
                except json.JSONDecodeError:
                    print("Invalid JSON response received.")
        except (FailedPrecondition, ResourceExhausted) as e:
            print(f"{type(e).__name__} occurred, retrying in {2**retries} seconds...")
            time.sleep(2**retries)
            retries += 1


# Save model outputs to a JSON file
with open('model_outputs.json', 'w') as f:
    print(f'Dumping data into file')
    json.dump(model_outputs, f)
    print(f'Done dumping data into file')
