from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/el-mahrousa/")
    page.wait_for_timeout(1000)

    # Login and create a lobby
    page.get_by_placeholder("Your Name").fill("TestPlayer")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="PLAY AS GUEST").click()
    page.wait_for_timeout(1000)

    page.get_by_role("button", name="CREATE NEW LOBBY").click()
    page.wait_for_timeout(1000)

    # Dismiss any dialog if exists
    try:
        page.locator('button:has(svg.lucide-x)').click()
        page.wait_for_timeout(500)
    except:
        pass

    # Start game
    page.get_by_role("button", name="START GAME").click()
    page.wait_for_timeout(6000) # wait for countdown

    # Try to open a property modal when it's our turn (which starts with ROLL)
    # The board is huge, let's just click on a random property tile using its id
    # First, let's cheat and give ourselves property and money
    # Wait, we can't cheat without modifying code.
    # Instead, we just verify that the "Buy House" button isn't disabled *because of phase*.
    # Actually, we can just click a property tile.

    # Try to click on Maadi (tile 1)
    page.locator("#tile-1").click()
    page.wait_for_timeout(1000)

    # Check that Buy House button exists in the modal, we can screenshot this
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
