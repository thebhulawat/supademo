import asyncio
from playwright.async_api import async_playwright
import os

async def start():
    async with async_playwright() as p:
        user_data_dir = os.path.expanduser('~/Library/Application Support/Google/Chrome')
        browser_type = p.chromium
        try:
            browser = await browser_type.launch_persistent_context(
                user_data_dir=user_data_dir,
                channel="chrome",
                headless=False,
                args=['--no-first-run', '--no-default-browser-check', '--disable-extensions'],
                ignore_default_args=['--enable-automation']
            )
            page = await browser.new_page()
            await page.goto('https://instagram.com')
            print("Successfully opened the browser and navigated to instagram.com")
            await asyncio.sleep(10)  # Keep the browser open for 10 seconds
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            if 'browser' in locals():
                await browser.close()

async def main():
    await start()

if __name__ == "__main__":
    asyncio.run(main())