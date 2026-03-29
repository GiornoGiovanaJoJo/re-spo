# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

RE-SPO is a Node.js/Express corporate website for an industrial equipment company. It uses file-based JSON storage (no database), Tailwind CSS for styling, and includes a full admin panel at `/admin`.

### Running the dev server

```
npm run dev
```

This starts both the Express server (port 3000) and Tailwind CSS watcher concurrently. See `package.json` scripts for individual commands.

### Key dev notes

- **No database required.** Data is stored in JSON files (`products.json`, `certificates.json`, `reviews.json`, `home-content.json`, `site-text.json`) at the project root.
- **Admin login:** Default admin key is `AlexErmakov2026` (defined in `server.js` as `DEFAULT_ADMIN_KEY`). The admin panel is at `/admin`.
- **No lint or test tooling** is configured in this project. There are no ESLint, Prettier, or test runner configurations. No automated tests exist.
- **SMTP and Captcha are optional.** The contact form requires `CONTACT_SMTP_*` env vars (see `contact-form.env.example`) to actually send emails; without them it gracefully returns a "mail not configured" error. `YANDEX_SMARTCAPTCHA_SECRET` is also optional.
- **CSS must be built** before the site renders properly. `npm run dev` handles this automatically via the Tailwind watcher. For a one-off build: `npm run build:css`.
- **No `.env` file is loaded automatically** by the server. Environment variables must be set in the shell or via a process manager.
