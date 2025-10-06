from playwright.sync_api import Page, expect
import time

def test_form_styles(page: Page):
    print("Starting verification script...")

    try:
        print("Navigating to login page...")
        page.goto("http://localhost:5173/login", timeout=60000)
        page.wait_for_load_state("networkidle")
        print("Login page loaded.")
        page.screenshot(path="jules-scratch/verification/login-page.png")
        print("Login page screenshot taken.")

        print("Navigating to register page...")
        page.goto("http://localhost:5173/register", timeout=60000)
        page.wait_for_load_state("networkidle")
        print("Register page loaded.")
        page.screenshot(path="jules-scratch/verification/register-page.png")
        print("Register page screenshot taken.")

        print("Navigating to forgot password page...")
        page.goto("http://localhost:5173/forgot-password", timeout=60000)
        page.wait_for_load_state("networkidle")
        print("Forgot password page loaded.")
        page.screenshot(path="jules-scratch/verification/forgot-password-page.png")
        print("Forgot password page screenshot taken.")

        print("Navigating to change password page...")
        page.goto("http://localhost:5173/change-password", timeout=60000)
        page.wait_for_load_state("networkidle")
        print("Change password page loaded.")
        page.screenshot(path="jules-scratch/verification/change-password-page.png")
        print("Change password page screenshot taken.")

        print("Verification script finished successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")