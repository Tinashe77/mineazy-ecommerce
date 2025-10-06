from playwright.sync_api import Page, expect

def test_form_styles(page: Page):
    # Go to the login page
    page.goto("http://localhost:5173/login")

    # Take a screenshot of the login page
    page.screenshot(path="jules-scratch/verification/login-page.png")

    # Go to the register page
    page.goto("http://localhost:5173/register")

    # Take a screenshot of the register page
    page.screenshot(path="jules-scratch/verification/register-page.png")

    # Go to the forgot password page
    page.goto("http://localhost:5173/forgot-password")

    # Take a screenshot of the forgot password page
    page.screenshot(path="jules-scratch/verification/forgot-password-page.png")

    # Go to the change password page (requires login, so this will redirect to login)
    page.goto("http://localhost:5173/change-password")

    # Take a screenshot of the change password page (redirected to login)
    page.screenshot(path="jules-scratch/verification/change-password-page.png")