# M-11: Stripping the seeded SQLite database from git history

The committed `backend/bookify_dev.db*` files contain seeded credentials
(`Admin@123`, `Student@123`) and any data entered during local development.
Untracking them from the index (the previous commit) prevents future
leaks, but the blobs remain reachable in the old history.

## One-time manual steps to fully purge

Install `git-filter-repo` (one-time):

```
pip install git-filter-repo
```

Then from the repo root:

```
git filter-repo --path backend/bookify_dev.db \
                 --path backend/bookify_dev.db-shm \
                 --path backend/bookify_dev.db-wal \
                 --invert-paths
```

Follow the on-screen prompts. The rewrite:

- Removes every commit that *only* touched those files
- Rewrites the remaining history so the blobs are unreachable
- Updates all branches and tags

After the rewrite, force-push the cleaned history:

```
git remote add origin <your-remote-url>   # if not already configured
git push origin --force --all
git push origin --force --tags
```

## Team impact

- Every team member must `git pull --rebase` (or re-clone) after the
  force-push, because their local SHAs no longer match.
- Anyone holding a clone built before the rewrite still has the seeded
  database on disk. The seeded credentials (`Admin@123`, `Student@123`)
  must be rotated on the first login attempt by deleting the
  `bookify_dev.db*` files locally and letting the seed reseed.

## Why this is a manual step

`git filter-repo` rewrites commit SHAs across the entire repository.
That's a destructive, irreversible operation that must be performed by
the repository owner (not an automated script). The `.gitignore` change
in this commit prevents the issue from recurring.

## Verify the fix

After rewriting:

```
git log --all --full-history -- backend/bookify_dev.db
```

Should print `fatal: ambiguous argument 'backend/bookify_dev.db'` —
meaning the path no longer exists in any commit.
