import sys
import urllib.parse as parse
from m3u8_downloader import Downloader
from selenium_get_url import InitDriver
from pathlib import Path


# 获取 m3u8 url 所在的 JSON 对象
def get_json(driver_path, course_url):
    try:
        url = InitDriver(driver_path, course_url).get_url()
    except Exception as e:
        return False
    if url is False:
        return False
    info = url.split('?')[1].split("=")[1]
    json = parse.unquote(info, encoding='utf-8', errors='replace')
    return json


if __name__ == '__main__':
    CHROME_DRIVER_PATH = Path(__file__).parent / 'lib/chromedriver'
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("Usage: python3 main.py <get_url> <course_url>\n" +
              "       python3 main.py <download> <m3u8_url> <output_path>")
        sys.exit(1)
    if sys.argv[1] == "get_json":
        COURSE_URL = sys.argv[2]
        if get_json(CHROME_DRIVER_PATH, COURSE_URL) is False:
            print("Failed to get course m3u8 file, passible causes:\n\
      1. Check your URL\n\
      2. ChromeDriver outdated, please download the latest version from https://chromedriver.chromium.org/home\n\
      3. Chaoxing is not working", file=sys.stderr)
    elif sys.argv[1] == "download":
        VIDEO_URL = sys.argv[2]
        OUTPUT_FILE_NAME = sys.argv[3]
        downloader = Downloader(50, OUTPUT_FILE_NAME)
        downloader.run(VIDEO_URL)
        print("Video downloaded to: " + str(Path.home()) + "/Downloads/" + OUTPUT_FILE_NAME)
    else:
        print("Usage: python3 main.py <get_url> <course_url>\n" +
              "       python3 main.py <download> <m3u8_url> <output_path>")
        sys.exit(1)
