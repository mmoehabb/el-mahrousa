from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Navigate to the local server
    page.goto("http://localhost:3000/el-mahrousa/")
    page.wait_for_timeout(1000)

    # 1. Login Screen
    page.get_by_placeholder("Your Name").fill("Player 1")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="PLAY AS GUEST").click()
    page.wait_for_timeout(1000)

    # 2. Lobby Screen
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
    # Click START GAME
    page.get_by_role("button", name="START GAME").click()
    page.wait_for_timeout(6000) # Wait longer for countdown and transition

    # Try to roll the dice if it's our turn
    try:
        # Use direct JS evaluation to bypass viewport issues
        page.evaluate('''() => {
            const diceContainer = document.querySelector('div[role="img"][aria-label^="Dice showing"]');
            if (diceContainer && diceContainer.parentElement) {
                diceContainer.parentElement.click();
            }
        }''')
        print("Rolled the dice!")
        page.wait_for_timeout(4000) # Wait for movement animation
        page.screenshot(path="/home/jules/verification/screenshots/after_roll.png")
    except Exception as e:
        print(f"Could not roll: {e}")

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
