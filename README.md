# Bracket Forge

Bracket Forge is a self-contained NHL playoff challenge site with:

- account registration and login
- a round-by-round Stanley Cup bracket picker
- saved challenge history for each user

## Run it

```bash
npm start
```

Then open `http://localhost:3000`.

## Storage

- user accounts and saved brackets: `data/db.json`
- session signing secret: `data/session.secret`

This app uses Node's built-in modules only, so there are no external packages to install.
