import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from litellm import completion
import re
from playwright.sync_api import sync_playwright 
import textwrap

# Load environment variables
load_dotenv()

async def run_browser_task(task_description):
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(user_data_dir=r'~/Library/Application\ Support/Google/Chrome/Profile\ 1', channel='chrome', headless=False)
        page = await browser.new_page()

        response = completion(
            model="claude-3-5-sonnet-20240620",
            messages=[
                {"role": "system", "content": """You are a Playwright expert. Generate Python code to accomplish the given task using Playwright's asynchronous API. 
                 Use 'async def' and 'await' keywords appropriately.  Do NOT include asyncio.run() or any event loop management. Do NOT have await browser.close() at the end of the code
                 Do NOT generate anything else other than code. No explantation or acknowledgement."""},
                {"role": "user", "content": f"Task: {task_description}"}
            ]
        )

        playwright_code = response.choices[0].message.content
        playwright_code = re.sub(r'```python\n|```', '', playwright_code).strip()
        
        print("Generated Playwright code:")
        print(playwright_code)

        # Execute the generated Playwright code
        try:
            # Create a local scope with necessary objects
            local_scope = {
                'page': page,
                'browser': browser,
                'asyncio': asyncio,
            }
            # Wrap the code in an async function and execute it
            exec(f"async def generated_task():\n{textwrap.indent(playwright_code, '    ')}", local_scope)
            await local_scope['generated_task']()
        except Exception as e:
            print(f"Error executing Playwright code: {e}")
            print("Error occurred on line:", e.__traceback__.tb_lineno)
        
        # Wait for user input before closing the browser
        input("Press Enter to close the browser...")
        await browser.close()

async def main():
    task = "Navigate to python.org and wait there for 2 mins"
    await run_browser_task(task)

if __name__ == "__main__":
    asyncio.run(main())