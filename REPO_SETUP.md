# Publish this repository to GitHub

This folder is a **standalone git repository** on disk. It is not nested inside `dev-portfolio`.

## 1. Create an empty repository on GitHub

Create a new public repository named `monochrome-particle` (or your preferred name). Do not add a README, `.gitignore`, or license on GitHub if you want a clean first push from this tree.

## 2. Initialize git (if needed)

```bash
cd /path/to/monochrome-particle
git init
git add .
git commit -m "Initial commit: Monochrome Particle skill and docs"
```

## 3. Add the remote and push

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/monochrome-particle.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username or organization.

## 4. Replace placeholders

Search the repo for `YOUR_USERNAME` and replace with your real GitHub slug:

- `README.md`
- `docs/index.html`
- `docs/INSTALL.md`
- `docs/INSTALL.html`

## 5. GitHub Pages (optional)

1. Repository **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/docs**

The site will be served at `https://YOUR_USERNAME.github.io/monochrome-particle/` (exact URL depends on repo name and org pages settings).

## 6. Keep portfolio in sync (optional)

Your portfolio can keep a copy under `.cursor/skills/monochrome-particle/` for offline use, or you can document `npx skills add ...` in the portfolio README and remove the duplicate.
