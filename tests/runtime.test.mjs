// tests/runtime.test.mjs — Node test runner regression for the BRAT online release contract.
//
// Run with:
//   npm run test:release                                             # draft must exist
//
// Environment overrides (CI / future-proofing):
//   BRAT_TAG          tag name expected on the GitHub Release (default: 0.2.12)
//   BRAT_OWNER_REPO   "owner/name" GitHub slug            (default: TheodorePeng/obsidian-workspace-bookmark-peng)
//   BRAT_REPO_ROOT    filesystem path to the repo root   (default: ".")

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const TAG = process.env.BRAT_TAG || '0.2.12';
const OWNER_REPO = process.env.BRAT_OWNER_REPO || 'TheodorePeng/obsidian-workspace-bookmark-peng';

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

test('release attaches BRAT-required assets to the draft', () => {
  // 1. Release exists at the expected tag.
  let json;
  try {
    json = gh(['release', 'view', TAG, '--repo', OWNER_REPO, '--json',
      'tagName,isDraft,isPrerelease,assets']);
  } catch (err) {
    assert.fail(
      `gh release view ${TAG} failed: ${err.message}. ` +
      'Did you run gh release create --draft?',
    );
  }

  const rel = JSON.parse(json);
  assert.equal(rel.tagName, TAG, `tagName mismatch (got ${rel.tagName})`);
  assert.equal(rel.isDraft, true, 'release must be a draft before promotion');
  assert.equal(rel.isPrerelease, false, 'release must not be a prerelease');

  // 2. Asset names are exactly main.js, manifest.json, styles.css.
  const names = rel.assets.map((a) => a.name).sort();
  assert.deepEqual(
    names,
    ['main.js', 'manifest.json', 'styles.css'],
    `asset names mismatch: ${JSON.stringify(names)}`,
  );
});
