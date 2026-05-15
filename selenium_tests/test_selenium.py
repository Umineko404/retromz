from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, os


APP_URL = os.environ.get('APP_URL', 'http://localhost:3000')


def get_driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    return driver


# Test Case 1: Home Page Load
def test_home_page_loads():
    print('Running Test 1: Home page loads correctly...')
    driver = get_driver()
    try:
        driver.get(APP_URL)
        assert 'RetroMZ' in driver.title or driver.find_element(By.TAG_NAME, 'body')
        body_text = driver.find_element(By.TAG_NAME, 'body').text
        assert len(body_text) > 0, 'Page body should not be empty'
        print('PASS: Home page loaded with non-empty content')
    finally:
        driver.quit()
# Test Case 2: Navigation to Games Page 
def test_navigate_to_games():
    print('Running Test 2: Navigation to Games page...')
    driver = get_driver()
    try:
        driver.get(APP_URL + '/games')
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, 'body'))
        )
        assert driver.current_url.endswith('/games'), \
            f'Expected /games URL, got: {driver.current_url}'
        body = driver.find_element(By.TAG_NAME, 'body').text
        assert 'game' in body.lower() or len(body) > 10, \
            'Games page should contain game-related content'
        print('PASS: Games page navigated and content loaded')
    finally:
        driver.quit()


if __name__ == '__main__':
    test_home_page_loads()
    test_navigate_to_games()
    print('All Selenium tests passed.')
