from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import os
import time

def start():
    user_data_dir = os.path.expanduser('~/Library/Application Support/Google/Chrome')
    chrome_options = Options()
    chrome_options.add_argument(f"user-data-dir={user_data_dir}")
    chrome_options.add_argument("--no-first-run")
    chrome_options.add_argument("--no-default-browser-check")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get('https://instagram.com')
        print("Successfully opened the browser and navigated to example.com")
        time.sleep(1000)  # Keep the browser open for 10 seconds
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    start()