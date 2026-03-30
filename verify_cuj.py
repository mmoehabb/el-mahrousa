from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the local server
    page.goto("http://localhost:3000/el-mahrousa/")
    page.wait_for_timeout(1000)

    # 1. Login Screen
    print("At Login Screen")
    page.get_by_placeholder("Your Name").fill("Player 1")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="PLAY AS GUEST").click()
    page.wait_for_timeout(1000)

    # 2. Lobby Screen
    print("At Lobby Screen")
    page.get_by_role("button", name="CREATE NEW LOBBY").click()
    page.wait_for_timeout(1500)

    # Dismiss any info dialogs if they appear
    try:
        dialog_close_btn = page.locator('button:has(svg.lucide-x)').first
        if dialog_close_btn.is_visible(timeout=1000):
            dialog_close_btn.click()
            page.wait_for_timeout(500)
    except Exception:
        pass

    # 3. Waiting Screen
    print("At Waiting Screen")
    # Click START GAME
    page.get_by_role("button", name="START GAME").click()
    page.wait_for_timeout(2000) # Wait for transition to Game Screen

    # 4. Game Screen
    print("At Game Screen")
    page.screenshot(path="/home/jules/verification/screenshots/game_screen.png")

    # Try to roll the dice if it's our turn
    try:
        roll_button = page.locator('div[role="img"][aria-label^="Dice showing"]')
        if roll_button.first.is_visible(timeout=2000):
             # Click the parent container of the dice which has the onClick handler
             roll_button.first.locator('..').click()
             print("Rolled the dice!")
             page.wait_for_timeout(3000) # Wait for movement animation
             page.screenshot(path="/home/jules/verification/screenshots/after_roll.png")

             # Try to buy property to see the floating text
             buy_button = page.get_by_role("button", name="BUY")
             if buy_button.is_visible(timeout=1000):
                 buy_button.click()
                 print("Bought property!")
                 page.wait_for_timeout(1000) # Wait for floating text animation
                 page.screenshot(path="/home/jules/verification/screenshots/after_buy.png")
    except Exception as e:
        print(f"Could not roll or buy: {e}")

    page.wait_for_timeout(2000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()  # MUST close context to save the video
            browser.close()
            print("Verification complete.")
