from llama_index.core.agent import ReActAgent
from llama_index.core.tools import FunctionTool
from llama_index.llms.openai import OpenAI
from dotenv import load_dotenv
from prompts import REACT_AGENT_PROMPT

load_dotenv()

# Define custom tools
def search_web(query: str) -> str:
    # Implement web search functionality
    return f"Web search results for: {query}"

def calculate(expression: str) -> str:
    try:
        result = eval(expression)
        return f"The result of {expression} is {result}"
    except:
        return "Invalid expression"

# Create function tools
search_tool = FunctionTool.from_defaults(fn=search_web, name="search_web", description="Search the web for information")
calculator_tool = FunctionTool.from_defaults(fn=calculate, name="calculator", description="Perform mathematical calculations")

# Initialize the LLM
llm = OpenAI(model="gpt-4o",system_prompt=REACT_AGENT_PROMPT.template)

# Create the ReAct agent
agent = ReActAgent.from_tools(
    
    [search_tool, calculator_tool],
    llm=llm,
    verbose=True,
)

# Use the agent
response = agent.chat("What's the population of France multiplied by 2?")
print(response)