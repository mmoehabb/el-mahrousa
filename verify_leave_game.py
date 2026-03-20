import os
from playwright.sync_api import sync_playwright

def verify_feature():
    os.makedirs("/app/verification/video", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/app/verification/video")
        page = context.new_page()

        try:
            page.goto("http://localhost:5173/el-mahrousa/")
            page.wait_for_timeout(1000)

            # Login
            page.fill("input[placeholder='Your Name']", "TestPlayer")
            page.keyboard.press("Enter")
            page.wait_for_timeout(1000)

            # Create Game
            page.click("button:has-text('CREATE NEW LOBBY')")
            page.wait_for_timeout(2000)

            # Start Game (Host)
            page.click("button:has-text('START GAME')")
            page.wait_for_timeout(6000)

            # Click LEAVE GAME
            page.click("button:has-text('LEAVE GAME')")
            page.wait_for_timeout(1000)

            # Verify confirmation dialog
            page.screenshot(path="/app/verification/leave_dialog.png")
            page.wait_for_timeout(1000)

            # Click Confirm to leave
            page.click("button:has-text('Confirm')")
            page.wait_for_timeout(2000)

            page.screenshot(path="/app/verification/left_game.png")
            page.wait_for_timeout(1000)

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    verify_feature()
