import asyncio
import base64
from typing import List, Optional, TypedDict
from langchain_core.messages import BaseMessage, SystemMessage
from playwright.async_api import Page
from langchain_core.runnables import chain as chain_decorator
from langchain_core.messages import SystemMessage
import re
import os

class BBox(TypedDict):
    x: float
    y: float
    text: str
    type: str
    ariaLabel: str

class Prediction(TypedDict):
    action: str
    args: Optional[List[str]]

class AgentState(TypedDict):
    page: Page
    input: str
    img: str
    bboxes: List[BBox]
    prediction: Prediction
    scratchpad: Optional[List[BaseMessage]]
    observation: str



@chain_decorator
async def mark_page(page):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    mark_page_js_path = os.path.join(script_dir, "mark_page.js")
    with open(mark_page_js_path) as f:
        mark_page_script = f.read()
    await page.evaluate(mark_page_script)
    bboxes = None
    for _ in range(10):
        try:
            bboxes = await page.evaluate("markPage()")
            break
        except Exception:
            await asyncio.sleep(3)
    
    if bboxes is None:
        raise Exception("Failed to get bounding boxes after multiple attempts")
    
    screenshot = await page.screenshot()
    await page.evaluate("unmarkPage()")
    return {
        "img": base64.b64encode(screenshot).decode(),
        "bboxes": bboxes,
    }

async def annotate(state):
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    return {**state, **marked_page}

def format_descriptions(state):
    labels = []
    for i, bbox in enumerate(state["bboxes"]):
        text = bbox.get("ariaLabel") or ""
        if not text.strip():
            text = bbox["text"]
        el_type = bbox.get("type")
        labels.append(f'{i} (<{el_type}/>): "{text}"')
    bbox_descriptions = "\nValid Bounding Boxes:\n" + "\n".join(labels)
    return {**state, "bbox_descriptions": bbox_descriptions}

def parse(text: str) -> dict:
    thought_prefix = "Thought: "
    action_prefix = "Action: "
    reply_prefix = "Reply: "
    
    lines = text.strip().split("\n")
    thought = ""
    action = ""
    reply = ""
    
    for line in lines:
        if line.startswith(thought_prefix):
            thought = line[len(thought_prefix):].strip()
        elif line.startswith(action_prefix):
            action = line[len(action_prefix):].strip()
        elif line.startswith(reply_prefix):
            reply = line[len(reply_prefix):].strip()
    
    if not action:
        return {"action": "retry", "args": f"Could not parse LLM Output: {text}"}
    
    split_output = action.split(" ", 1)
    if len(split_output) == 1:
        action_type, action_input = split_output[0], None
    else:
        action_type, action_input = split_output
    
    action_type = action_type.strip()
    if action_input is not None:
        action_input = [inp.strip().strip("[]") for inp in action_input.strip().split(";")]
    
    return {
        "action": action_type,
        "args": action_input,
        "reply": reply
    }

def update_scratchpad(state: AgentState):
    old = state.get("scratchpad", [])
    if old:
        txt = old[0].content
        last_line = txt.rsplit("\n", 1)[-1]
        step = int(re.match(r"\d+", last_line).group()) + 1
    else:
        txt = "Previous action observations:\n"
        step = 1
    txt += f"\n{step}. {state['observation']}"

    return {**state, "scratchpad": [SystemMessage(content=txt)]}

async def test_mark_page_script(page):
    with open("goodscript.js", "r") as f:
        good_script = f.read()
    
    await page.evaluate(good_script)
    
    result = await page.evaluate("buildTreeFromBody()")
    
    elements = result[0]
    print(f"Total elements found: {len(elements)}")
    
    interactable_elements = [elem for elem in elements if elem.get('interactable')]
    print(f"Interactable elements found: {len(interactable_elements)}")
    
    for i, element in enumerate(interactable_elements[:5]):
        print(f"Interactable Element {i + 1}:")
        print(f"  Tag: {element.get('tagName')}")
        print(f"  Text: {element.get('text')[:50]}...")
        print(f"  Rect: {element.get('rect')}")
    
    await page.evaluate("""
        (elements) => {
            console.log('Drawing bounding boxes for', elements.length, 'elements');
            drawBoundingBoxes(elements);
            console.log('Bounding boxes drawn');
        }
    """, interactable_elements)
    
    bounding_box_count = await page.evaluate("""
        () => {
            const container = document.querySelector('#boundingBoxContainer');
            return container ? container.childElementCount : 0;
        }
    """)
    print(f"Number of bounding boxes created: {bounding_box_count}")
    
    await page.wait_for_timeout(10000)
    
    await page.evaluate("removeBoundingBoxes()")