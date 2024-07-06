train_prompt = '''This is the video for a user flow on Hubspot. This video is part of a Machine Learning Training dataset. The model is supposed to execute the user flow in browser when prompted. This is a VERY CRITICAL dataset. Your job is provide a structured JSON array output for all the actions that user performed. 

Here is the list of all possible  actions_types - 
action_type = "click","input","selection","drag","scroll","hover","keyboardShortcut","gesture","focus","blur" ,"copy","paste","rightClick","doubleClick","dragScroll","mouseWheel","keyPress","voiceCommand","cameraInteraction","biometricAuthentication"

Here is the list of all possible element_types -
element_types -  "click", "text entry", "number entry", "password entry", "email entry", "phone number entry", "date selection", "time selection", "file upload", "image upload", "voice input", "autocomplete selection", "dropdown selection", "multi-select dropdown", "checkbox selection", "radio button selection", "list item selection", "tag selection", "drag and drop item", "reorder list", "resize element", "crop image", "page scrolling", "element scrolling", "infinite scroll loading", "hover", "copy", "paste", "save", "undo", "navigation", "submit form", "pinch to zoom", "swipe to navigate", "double-tap to zoom", "long press", "focus", "blur", "right-click", "double-click", "drag scroll", "mouse wheel scroll", "key press", "voice command", "QR code scanning", "document capture", "facial recognition", "fingerprint scan", "voice recognition" 

Here are the instruction which must be strictly followed - 
1. DO NOT MISS any action. 
2. DO NOT output anything other than JSON array. 
3. ALWAYS provide four entries in each item of the array - action, element_type, element, value. 
4. IF value is not present, provide NA.  
5. DO NOT use any other value for action and element_type other than the list provided above. 

Refer to following example JSON format - 
[
    {
        "action_type": "click",
        "element_type": "button",
        "element": "crm",
        "value": "NA"
    },
    {
        "action_type": "click",
        "element_type": "button",
        "element": "contacts",
        "value": "NA"
    },
    {
        "action_type": "click",
        "element_type": "button",
        "element": "create contact",
        "value": "NA"
    }, 
    {
        "action_type": "input",
        "element_type": "text entry",
        "element": "email",
        "value": "abc@gmail.com",
    },
    {
        "action_type": "input",
        "element_type": "number entry",
        "element": "phone number",
        "value": "9627263519"
    },
]
'''