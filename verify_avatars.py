import time
from playwright.sync_api import Page, expect, sync_playwright

def verify_feature(page: Page):
    page.goto("http://localhost:5173/")
    page.wait_for_timeout(1000)

    # Fill name
    name_input = page.locator("input[type='text']")
    name_input.fill("Tester")
    page.wait_for_timeout(500)

    # Click play as guest
    page.get_by_role("button", name="PLAY AS GUEST").click()
    page.wait_for_timeout(1000)

    # Click create new lobby
    page.get_by_role("button", name="CREATE NEW LOBBY").click()
    page.wait_for_timeout(1000)

    # Click START GAME
    page.locator("text=START GAME").first.click()

    # Wait for the countdown to finish (5 seconds + buffer)
    page.wait_for_timeout(6000)

    # Dismiss info dialog if it exists
    close_btn = page.locator("button:has(svg.lucide-x)").first
    if close_btn.is_visible():
        close_btn.click()
        page.wait_for_timeout(500)

    # Take a screenshot of the board to see the player tokens
    page.screenshot(path="/home/jules/verification/verification.png", full_page=True)
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
