from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1,
            color_scheme='light'
        )

        # Navigate to dev server with base path
        page.goto("http://localhost:3000/el-mahrousa/")

        # Bypass Login
        page.fill('input[placeholder="Your Name"]', "Test User")
        page.click('button:has-text("PLAY AS GUEST")')
        page.click('button:has-text("CREATE NEW LOBBY")')

        time.sleep(2)

        # In waiting room, add a bot and start game
        page.click('button:has-text("Add Bot")')
        time.sleep(1)
        page.click('button:has-text("START GAME")')

        # Wait for the countdown
        time.sleep(5)

        # We need to dismiss any dialogs first
        page.evaluate("""() => {
            const closeBtns = document.querySelectorAll('button');
            closeBtns.forEach(btn => {
                if (btn.querySelector('svg.lucide-x')) {
                    btn.click();
                }
            });
        }""")

        time.sleep(1)

        # Open Controls panel
        page.evaluate("""() => {
            const controlsBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('CONTROLS') || btn.querySelector('.lucide-gamepad2'));
            if(controlsBtn) controlsBtn.click();
        }""")

        time.sleep(1)

        # Open Trade Modal
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const proposeTradeBtn = btns.find(btn => btn.textContent.includes('TRADE') || btn.textContent.includes('PROPOSE'));
            if(proposeTradeBtn) proposeTradeBtn.click();
        }""")

        time.sleep(1)
        page.screenshot(path="debug_5.png")

        # Expand the custom dropdown
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const dropdownBtn = btns.find(btn => btn.querySelector('svg.lucide-chevron-down'));
            if (dropdownBtn) dropdownBtn.click();
        }""")

        time.sleep(1)
        # Take a screenshot showing the expanded dropdown
        page.screenshot(path="trade_dropdown_light.png", full_page=True)
        print("Captured trade_dropdown_light.png")

        # Now test Dark Mode
        page.emulate_media(color_scheme='dark')
        page.click('h2:has-text("TRADE")') # click elsewhere to close dropdown
        time.sleep(1)

        # Expand again
        page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const dropdownBtn = btns.find(btn => btn.querySelector('svg.lucide-chevron-down'));
            if (dropdownBtn) dropdownBtn.click();
        }""")
        time.sleep(1)

        # Take a screenshot showing the expanded dropdown
        page.screenshot(path="trade_dropdown_dark.png", full_page=True)
        print("Captured trade_dropdown_dark.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
