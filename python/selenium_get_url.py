from selenium import webdriver
from selenium.webdriver.support.wait import WebDriverWait
# from selenium.webdriver.chrome.service import Service as ChromeService  # Selenium4
from selenium.webdriver.chrome.options import Options

class Judge:
  def __call__(self, driver):
    node = driver.find_element("xpath", '//*[@id="viewFrame"]')
    if 'm3u8' in node.get_attribute('src'):
      return node.get_attribute('src')
    else:
      return False

class InitDriver:
  def __init__(self, driver_path, course_url):
    self.options = Options()
    self.options.add_argument('--headless')
    self.options.add_argument('--disable-gpu')
    # self.service = ChromeService(executable_path=driver_path)  # Selenium4
    # self.driver = webdriver.Chrome(service=self.service, options=self.options)  # Selenium4
    self.driver = webdriver.Chrome(executable_path=driver_path, options=self.options)
    self.driver.get(course_url)

  def get_url(self):
    try:
      element = WebDriverWait(self.driver, 30).until(Judge())
      self.driver.quit()
      return element
    except Exception as e:
      self.driver.quit()
      return False