import os
from dotenv import load_dotenv
import google.generativeai as genai 
from IPython.display import Video
from IPython.display import Image

load_dotenv('../.env.local')
api_key = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=api_key)



#sample_file = genai.upload_file(path='./data/image.jpg', display_name="sample image", mime_type='image/jpeg')

#sample_file = genai.upload_file(path='./data/CreateContact.mov', display_name="CreateContact", mime_type='video/mov')

#print(f"Uploaded file {sample_file.display_name} as: {sample_file.uri}")
#print(sample_file.name)

file = genai.get_file(name='files/vzgag0lnrle9')
#file = genai.get_file(name=sample_file.name)

print(file)
#print(f"Retreived file {file.display_name} as: {sample_file.uri}")

model = genai.GenerativeModel(model_name='models/gemini-1.5-pro')

response = model.generate_content(["Describe what is happning in the video", file])

print(response.text)

