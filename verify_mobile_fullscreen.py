import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Emulate a mobile device
        iphone_13 = p.devices['iPhone 13']

        # Ensure verification/video directory exists
        os.makedirs("verification/video", exist_ok=True)

        context = await browser.new_context(
            **iphone_13,
            record_video_dir="verification/video/",
            record_video_size={"width": 390, "height": 844}
        )

        page = await context.new_page()

        print("Navigating to http://localhost:5173/el-mahrousa/ ...")
        await page.goto("http://localhost:5173/el-mahrousa/")

        # Fill in a valid name (<= 12 chars)
        print("Filling in name...")
        await page.fill("input[placeholder='Your Name'], input[placeholder='اسمك هنا']", "MobileUser")

        print("Clicking PLAY AS GUEST...")
        await page.click("button:has-text('PLAY AS GUEST'), button:has-text('العب كضيف')")

        print("Waiting for CREATE NEW LOBBY button...")
        await page.wait_for_selector("button:has-text('CREATE NEW LOBBY'), button:has-text('إنشاء لعبة جديدة')", timeout=30000)
        print("Clicking CREATE NEW LOBBY...")
        await page.click("button:has-text('CREATE NEW LOBBY'), button:has-text('إنشاء لعبة جديدة')")

        print("Dismissing info dialogs if any...")
        try:
            await page.wait_for_selector("button:has(svg.lucide-x)", timeout=5000)
            close_buttons = await page.locator("button:has(svg.lucide-x)").all()
            for btn in close_buttons:
                await btn.click()
                await asyncio.sleep(0.5)
        except Exception as e:
            print("No info dialogs to dismiss or error:", e)

        print("Waiting for START GAME button...")
        await page.wait_for_selector("button:has-text('START GAME'), button:has-text('ابدأ اللعبة')", timeout=15000)
        print("Clicking START GAME...")
        await page.click("button:has-text('START GAME'), button:has-text('ابدأ اللعبة')")

        # Wait for the countdown
        print("Waiting for game to start (countdown)...")
        await asyncio.sleep(6)

        # Wait for board to be visible
        print("Waiting for board...")
        await page.wait_for_selector(".react-transform-wrapper", timeout=15000)

        print("Taking a screenshot...")
        os.makedirs("verification/screenshots", exist_ok=True)
        screenshot_path = "verification/screenshots/mobile_fs.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        video_path = await page.video.path()
        print(f"Video saved to {video_path}")

        await context.close()
        await browser.close()

        return screenshot_path, video_path

if __name__ == "__main__":
    asyncio.run(main())