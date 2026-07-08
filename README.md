# Smart Scientific Calculator

A premium, fully functional, and highly polished **Scientific Calculator** web application built with HTML, CSS, and Vanilla JavaScript. It features a modern glassmorphic look, real-time live preview, light/dark themes, responsive scientific panels, and a custom recursive-descent math parser.

## Key Features

- **Custom Math Parser**: Enforces correct mathematical precedence (PEMDAS/BODMAS), supports nested parentheses, implicit multiplication (e.g., `2π`, `(5+3)(2-1)`), exponents (`^`), postfix percent (`%`), postfix factorial (`!`), and scientific notation (`EXP` button). Evaluated safely without using `eval()`.
- **Live Preview Display**: Real-time evaluation of the running expression as you type. Trailing operators or open parentheses are gracefully ignored or resolved to present a smooth live preview.
- **Glassmorphic Aesthetic**: Frosted glass panels, sharp border outlines, dynamic ambient background glows, and high contrast text ratios optimized for accessibility.
- **Scientific Drawer**: Toggling the `SC` button smoothly expands the width of the card and slides open a comprehensive secondary grid of 18 scientific keys.
- **Persisted Dark & Light Modes**: Sun and moon SVG icons rotating and fading with elegant transition curves. The theme selection is persisted across page reloads using `localStorage`.
- **Degree & Radian Support**: Real-time trigonometric evaluation toggles between Degrees (DEG) and Radians (RAD) mode.
- **Keyboard Mappings**: Type numbers, decimals, basic operators, brackets, backspace (delete), esc (all clear), or enter (equals) using your physical keyboard.
- **Long-Press AC**: A secondary tap-and-hold (or mouse long-press) on the `AC` button performs a convenient backspace deletion.

---

## Local Development

If you want to run or test the calculator locally:

1. **Direct Preview**: You can simply open `index.html` directly in any web browser.
2. **Local Static Server**:
   ```sh
   python3 -m http.server 8000
   ```
   Open `http://localhost:8000` to interact with the app.
3. **Cloudflare Pages Wrangler Server** (requires Node.js):
   ```sh
   npm install
   npm run dev
   ```
   This launches Wrangler's development environment to test exactly how Cloudflare Pages serves the directory.

To run the programmatic expression parser unit tests, navigate to `http://localhost:8000/test.html` in your browser.

---

## Deploying to Cloudflare Pages

This project is fully ready for deployment as a static site on **Cloudflare Pages**. 

Follow these steps to deploy:

1. Log in to your **Cloudflare Dashboard** and navigate to **Workers & Pages**.
2. Click **Create Application** and select the **Pages** tab.
3. Click **Connect to Git** and choose the repository `Smart-Scientific-Calculator`.
4. In the **Build settings** section, configure the following:
   - **Framework preset**: `None`
   - **Build command**: (Leave empty)
   - **Build output directory**: (Leave empty or enter `/` or `.`)
5. Click **Save and Deploy**.

Cloudflare Pages will build the site in seconds and provide you with a unique `<your-project>.pages.dev` URL. It will automatically re-deploy every time you push new commits to your GitHub repository.