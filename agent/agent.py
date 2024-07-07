import os
from playwright.async_api import async_playwright
from langgraph.graph import END, StateGraph
from utils import (
    AgentState, annotate,
    format_descriptions, parse, update_scratchpad
)
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from prompts import prompt
from tools import tools
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import uvicorn
import logging
from contextlib import asynccontextmanager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set up environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "SupaDemo"
load_dotenv()

# Global variables to store Playwright instances
p = None
browser = None
page = None

async def initialize_browser():
    global p, browser, page
    if p is None or browser is None or page is None:
        p = await async_playwright().start()
        browser = await p.chromium.launch(headless=False, args=None)  # Changed to headless for server environment
        page = await browser.new_page()
        await page.goto("https://collectivai.atlassian.net/jira/software/projects/KAN/boards/1")
    return page


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await initialize_browser()
        logger.info("Browser initialized successfully on startup")
    except Exception as e:
        logger.error(f"Failed to initialize browser on startup: {str(e)}")
    
    yield
    
    # Shutdown
    global p, browser, page
    if browser:
        await browser.close()
    if p:
        await p.stop()
    logger.info("Browser and Playwright instance closed")

app = FastAPI(lifespan=lifespan)


# Set up the agent
llm = ChatOpenAI(model="gpt-4-turbo", max_tokens=4096)
agent = annotate | RunnablePassthrough.assign(
    prediction=format_descriptions | prompt | llm | StrOutputParser() | parse
)

# Set up the graph
graph_builder = StateGraph(AgentState)

graph_builder.add_node("agent", agent)
graph_builder.set_entry_point("agent")

graph_builder.add_node("update_scratchpad", update_scratchpad)
graph_builder.add_edge("update_scratchpad", "agent")

for node_name, tool in tools.items():
    graph_builder.add_node(
        node_name,
        RunnableLambda(tool) | (lambda observation: {"observation": observation}),
    )
    graph_builder.add_edge(node_name, "update_scratchpad")

def select_tool(state: AgentState):
    action = state["prediction"]["action"]
    if action == "ANSWER":
        return END
    if action == "retry":
        return "agent"
    return action

graph_builder.add_conditional_edges("agent", select_tool)

graph = graph_builder.compile()

async def run_agent(page, input_text):
    state = {"page": page, "input": input_text, "scratchpad": []}
    async for event in graph.astream(state):
        if "prediction" in event:
            yield event["prediction"]
        elif "observation" in event:
            yield event["observation"]
    

async def run_agent_with_input(page, input_text):
    async for output in run_agent(page, input_text):
        if isinstance(output, dict) and "action" in output:
            print(f"Action: {output['action']}")
            if output.get("args"):
                print(f"Args: {output['args']}")
            if output.get("reply"):
                print(f"Reply: {output['reply']}")
        else:
            print(f"Observation: {output}")

async def main():
    p, browser, page = await initialize_browser()
    
    try:
        input_text = "Show me how to create a new project in Jira"
        await run_agent_with_input(page, input_text)

    finally:
        await browser.close()
        await p.stop()


@app.get("/run_agent")
async def run_agent_endpoint(input_text: str):
    try:
        page = await initialize_browser()
        
        async def generate():
            async for output in run_agent(page, input_text):
                if isinstance(output, dict) and "action" in output:
                    print(f"Action: {output['action']}\n")
                    yield f"Action: {output['action']}\n"
                    if output.get("args"):
                        print(f"Args: {output['args']}\n")
                        yield f"Args: {output['args']}\n"
                    if output.get("reply"):
                        print(f"Reply: {output['reply']}\n")
                        yield f"Reply: {output['reply']}\n"
                else:
                    yield f"Observation: {output}\n"
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        logger.error(f"Error in run_agent_endpoint: {str(e)}")
        return {"error": str(e)}   
    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")