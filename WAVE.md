# Wave invoice fork

This fork carries a small patch on top of an upstream BigCapital release, so the invoice PDF looks like a Wave invoice. It also publishes a server image with that patch to Docker Hub.

- `wave-invoice-base` is the upstream release tag, unchanged (now `v0.25.48`).
- `wave-invoice` is that tag plus the commits below. It is long-lived: a new upstream release is a rebase.

## What the patch changes

Only `shared/pdf-templates`, the React templates the server renders to HTML and Gotenberg prints to PDF:

1. **Notes keep their line breaks** (`PaperTemplate.tsx`): the notes and terms block gets `white-space: pre-line`, so a multi-line note prints one line per line instead of running together. This applies to every document that has notes: invoices, estimates, receipts and credit notes.
2. **Wave layout for the invoice** (`InvoicePaperTemplate.tsx`), top to bottom:
   - A header band: the logo on the left, `INVOICE` over the company block on the right.
   - A full-width rule.
   - Bill To on the left, the invoice details box on the right (number, date, payment due, a shaded Amount Due row).
   - The items table, with a header band in the template's primary colour across the full page width.
   - The totals, then the notes.
   - A 28px side margin (Wave's 21.5pt) instead of 30px, and a solid top bar in place of the inset shadow, which left a hairline down both edges of the page.

   Estimates, receipts and credit notes keep the stock layout.

The webapp bundles the same templates for the preview on the invoice customization screen. Only the server image is rebuilt, so that preview stays stock. The PDF that is downloaded, printed or emailed comes from the server and uses the Wave layout.

The commits that add this file and `.github/workflows/publish-wave-image.yml` are fork tooling. They do not change the image.

## Rebase onto a new upstream release

```sh
OLD=v0.25.48 NEW=vX.Y.Z
git fetch upstream tag "$NEW"
git push origin "$NEW"                          # the workflow names the image after this tag
git rebase --onto "$NEW" "$OLD" wave-invoice    # replay the fork's commits; fix any conflict in the templates
git branch -f wave-invoice-base "$NEW"
git push --force-with-lease origin wave-invoice wave-invoice-base
```

Update the version named at the top of this file. Before publishing, build the image and render the template's demo invoice with a two-line note through it:

```sh
docker build --file packages/server/Dockerfile --tag bigcapital-server:wave-check .
docker run --rm --network none --entrypoint node bigcapital-server:wave-check -e \
  "process.stdout.write(require('/app/shared/pdf-templates').renderInvoicePaperTemplateHtml({statement: 'Line one\nLine two'}))" \
  > invoice.html
```

Open `invoice.html` in a browser. It should show the Wave layout described above, with the note on two lines.

## Publish

The image is `<DOCKERHUB_USERNAME>/bigcapital-server`, with two tags per build:

- `<upstream-version>-wave`, for example `v0.25.48-wave`. This tag moves to the latest build of that release.
- `<upstream-version>-wave-<shortsha>`, which names one commit of `wave-invoice` and never moves.

Deployments should pin the digest.

### With the workflow

One-time setup:

- Enable Actions on the fork. GitHub keeps a fork's workflows off until someone accepts them in the Actions tab.
- Make `wave-invoice` the default branch (Settings > General > Default branch). GitHub only offers a manual run for a workflow that exists on the default branch, and the workflow exists only on `wave-invoice`.
- Add the repository variable `DOCKERHUB_USERNAME` (Settings > Secrets and variables > Actions).
- Add the repository secret `DOCKERHUB_TOKEN` in the same place: a Docker Hub access token with Read & Write scope.

Then run **Publish Wave server image** on the `wave-invoice` branch, from the Actions tab or with:

```sh
gh workflow run publish-wave-image.yml --repo rameskum/bigcapital --ref wave-invoice
```

The workflow is manual only. It builds the way upstream's `build-deploy-container.yml` does: the repository root as the context, `packages/server/Dockerfile`, and `linux/amd64` plus `linux/arm64`. It pushes both tags and prints the digest in the log and the run summary. The arm64 half is emulated, so a run takes a while.

### By hand

The equivalent, from a clean checkout of `wave-invoice`:

```sh
USER=<docker-hub-username>
VERSION=$(git describe --tags --abbrev=0 --match 'v[0-9]*')
SHORT=$(git rev-parse --short=7 HEAD)
docker login --username "$USER"                 # paste the access token when asked
docker buildx build --platform linux/amd64,linux/arm64 \
  --file packages/server/Dockerfile \
  --tag "$USER/bigcapital-server:$VERSION-wave" \
  --tag "$USER/bigcapital-server:$VERSION-wave-$SHORT" \
  --push .
docker buildx imagetools inspect "$USER/bigcapital-server:$VERSION-wave-$SHORT"   # prints the digest
```

Multi-platform `--push` needs a buildx builder that uses the `docker-container` driver (`docker buildx create --use`), and QEMU for the foreign platform.

## The image is public and holds no secrets

The repository on Docker Hub is public. The image holds what upstream's image holds: the open-source code built from this repository and its dependencies. `.dockerignore` keeps `.env` files, `.git` and CI files out of the build context, and the build takes no credentials. Database passwords, JWT secrets, mail and S3 keys all come from the environment when the container starts, exactly as with `bigcapitalhq/server`. Use it as a drop-in replacement for `bigcapitalhq/server` of the same version, including the one-off migration container.
