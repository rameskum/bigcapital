# Wave invoice fork

This fork carries a few small patches on top of an upstream BigCapital release: the invoice PDF looks like a Wave invoice, sales PDFs print line amounts before tax, and the edit forms show the right totals. It also publishes server and webapp images with those patches to Docker Hub.

- `wave-invoice-base` is the upstream release tag, unchanged (now `v0.25.48`).
- `wave-invoice` is that tag plus the commits below. It is long-lived: a new upstream release is a rebase.

**Never use GitHub's "Sync fork" on `wave-invoice`.** It merges unreleased upstream `develop`, database migrations included, into the branch, while the images keep the release's version in their tags. Move to a new BigCapital release only by [rebasing onto its tag](#rebase-onto-a-new-upstream-release).

## What the patches change

### PDF templates

`shared/pdf-templates`, the React templates the server renders to HTML and Gotenberg prints to PDF:

1. **Notes keep their line breaks** (`PaperTemplate.tsx`): the notes and terms block gets `white-space: pre-line`, so a multi-line note prints one line per line instead of running together. This applies to every document that has notes: invoices, estimates, receipts and credit notes.
2. **Wave layout for the invoice** (`InvoicePaperTemplate.tsx`), top to bottom:
   - A header band: the logo on the left, `INVOICE` over the company block on the right.
   - A full-width rule.
   - Bill To on the left, the invoice details box on the right (number, date, payment due, a shaded Amount Due row).
   - The items table, with a header band in the template's primary colour across the full page width.
   - The totals, then the notes.
   - A 28px side margin (Wave's 21.5pt) instead of 30px, and a solid top bar in place of the inset shadow, which left a hairline down both edges of the page.

   Estimates, receipts and credit notes keep the stock layout.

The webapp bundles the same templates for the preview on the invoice customization screen, so the fork's webapp image shows the Wave layout there too. The PDF that is downloaded, printed or emailed comes from the server.

### Server: PDF line amounts before tax

Upstream prints `ItemEntry.total`, which includes exclusive tax, as the line total of invoice, receipt, estimate and credit note PDFs, so the lines do not add up to the Subtotal. The patch adds `lineAmountFormatted` (quantity x rate - line discount) to `ItemEntry.transformer.ts` and prints it from the four `utils.ts` files of those modules. Emails and the payment link page are unchanged.

**Drop this patch** if upstream fixes it.

### Webapp: edit form totals

Upstream's `getEntriesTotal` concatenates the blank last line's `''` amount as a string, so an edit form opens with a Total and Due Amount about ten times too high ([upstream issue 1579](https://github.com/bigcapitalhq/bigcapital/issues/1579)). The patch is exactly [upstream PR 1609](https://github.com/bigcapitalhq/bigcapital/pull/1609), plus a unit test.

**Drop this patch** once PR 1609 is released upstream. The webapp then only differs by the template preview, so the deployment can go back to `bigcapitalhq/webapp`.

The commits that add this file and `.github/workflows/publish-wave-image.yml` are fork tooling. They do not change the images.

## Rebase onto a new upstream release

```sh
OLD=v0.25.48 NEW=vX.Y.Z
git fetch upstream tag "$NEW"
git push origin "$NEW"                          # the workflow names the image after this tag
git rebase --onto "$NEW" "$OLD" wave-invoice    # replay the fork's commits; fix any conflicts
git branch -f wave-invoice-base "$NEW"
git push --force-with-lease origin wave-invoice wave-invoice-base
```

Update the version named at the top of this file. Before publishing, build both images and render the template's demo invoice with a two-line note through it:

```sh
docker build --file packages/server/Dockerfile --tag bigcapital-server:wave-check .
docker build --file packages/webapp/Dockerfile --tag bigcapital-webapp:wave-check .
docker run --rm --network none --entrypoint node bigcapital-server:wave-check -e \
  "process.stdout.write(require('/app/shared/pdf-templates').renderInvoicePaperTemplateHtml({statement: 'Line one\nLine two'}))" \
  > invoice.html
```

Open `invoice.html` in a browser. It should show the Wave layout described above, with the note on two lines.

## Publish

The images are `<DOCKERHUB_USERNAME>/bigcapital-server` and `<DOCKERHUB_USERNAME>/bigcapital-webapp`, each with two tags per build:

- `<upstream-version>-wave`, for example `v0.25.48-wave`. This tag moves to the latest build of that release.
- `<upstream-version>-wave-<shortsha>`, which names one commit of `wave-invoice` and never moves.

Deployments should pin the digest, and take the server and webapp from the same commit.

### With the workflow

One-time setup:

- Enable Actions on the fork. GitHub keeps a fork's workflows off until someone accepts them in the Actions tab.
- Make `wave-invoice` the default branch (Settings > General > Default branch). GitHub only offers a manual run for a workflow that exists on the default branch, and the workflow exists only on `wave-invoice`.
- Add the repository variable `DOCKERHUB_USERNAME` (Settings > Secrets and variables > Actions).
- Add the repository secret `DOCKERHUB_TOKEN` in the same place: a Docker Hub access token with Read & Write scope.
- Add the fork to the repositories of the owner's `hlx-homelab-ci` GitHub App installation. The job runs on the self-hosted `homelab-ci` runner, which only takes jobs from those repositories; without this the run stays queued.
- Require approval for all external contributors (Settings > Actions > General > Fork pull request workflows). The fork is public, and a pull request can bring its own workflow that asks for `homelab-ci`, so read a pull request's workflow changes before approving its run.

Then run **Publish Wave images** on the `wave-invoice` branch, from the Actions tab or with:

```sh
gh workflow run publish-wave-image.yml --repo rameskum/bigcapital --ref wave-invoice
```

The workflow is manual only, and must stay so: it runs on the owner's self-hosted runner. Like upstream's `build-deploy-container.yml` it builds `packages/server/Dockerfile` and `packages/webapp/Dockerfile` with the repository root as the context, but for `linux/amd64` only, because the homelab is amd64. One job per image keeps its layer cache in the GitHub Actions cache, pushes both tags and prints the digest in the log and the run summary. The jobs are independent: if one fails, re-run it so both images come from the same commit.

### By hand

The equivalent, from a clean checkout of `wave-invoice`:

```sh
USER=<docker-hub-username>
VERSION=$(git describe --tags --abbrev=0 --match 'v[0-9]*')
SHORT=$(git rev-parse --short=7 HEAD)
docker login --username "$USER"                 # paste the access token when asked
for IMAGE in server webapp; do
  docker buildx build --platform linux/amd64 \
    --file "packages/$IMAGE/Dockerfile" \
    --tag "$USER/bigcapital-$IMAGE:$VERSION-wave" \
    --tag "$USER/bigcapital-$IMAGE:$VERSION-wave-$SHORT" \
    --push .
  docker buildx imagetools inspect "$USER/bigcapital-$IMAGE:$VERSION-wave-$SHORT"   # prints the digest
done
```

## The images are public and hold no secrets

The repositories on Docker Hub are public. The images hold what upstream's images hold: the open-source code built from this repository and its dependencies. `.dockerignore` keeps `.env` files, `.git` and CI files out of the build context, and the builds take no credentials. Database passwords, JWT secrets, mail and S3 keys all come from the environment when the server container starts, exactly as with `bigcapitalhq/server`. On amd64, use them as drop-in replacements for `bigcapitalhq/server` and `bigcapitalhq/webapp`, including the one-off migration container.
