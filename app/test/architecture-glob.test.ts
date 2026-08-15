import { describe, expect, it } from "vitest";
import {
  claimingPattern,
  claimsDirContents,
  claimsPath,
  matchSegment,
} from "../src/lib/architecture/glob";

// Semantics table for the hand-rolled gitignore-subset matcher (T-011).
// Every rule documented in glob.ts is pinned here; the derivation's
// file→component mapping is only as trustworthy as these tables.

describe("matchSegment", () => {
  const cases: [pattern: string, text: string, expected: boolean][] = [
    ["utils.ts", "utils.ts", true],
    ["utils.ts", "utils.tsx", false],
    ["*", "anything", true],
    ["*", "", true],
    ["*.ts", "board-model.ts", true],
    ["*.ts", "board-model.tsx", false],
    ["*.ts", ".ts", true],
    ["a*b", "ab", true],
    ["a*b", "axxb", true],
    ["a*b", "axxc", false],
    ["*ab", "aab", true], // star backtracking
    ["a*b*c", "a-b-b-c", true],
    ["?", "x", true],
    ["?", "", false],
    ["?x", "ax", true],
    ["b?ard", "board", true],
    // Unsupported constructs are literal characters, never wildcards.
    ["[ab]", "a", false],
    ["[ab]", "[ab]", true],
    ["{a,b}", "a", false],
    ["\\*", "x", false],
    // Case-sensitive byte comparison.
    ["App.tsx", "app.tsx", false],
  ];
  for (const [pattern, text, expected] of cases) {
    it(`${JSON.stringify(pattern)} vs ${JSON.stringify(text)} -> ${expected}`, () => {
      expect(matchSegment(pattern, text)).toBe(expected);
    });
  }
});

describe("claimsPath: anchored patterns", () => {
  it("matches an exact literal file", () => {
    expect(claimsPath(["app/index.html"], "app/index.html")).toBe(true);
    expect(claimsPath(["app/index.html"], "app/index.htm")).toBe(false);
  });

  it("`dir/**` matches everything inside, at any depth", () => {
    expect(claimsPath(["lib/parser/**"], "lib/parser/src/task.ts")).toBe(true);
    expect(claimsPath(["lib/parser/**"], "lib/parser/package.json")).toBe(true);
    expect(claimsPath(["lib/parser/**"], "lib/parser/test/deep/nest/x.ts")).toBe(true);
  });

  it("terminal `**` needs at least one segment: a/** never matches the file a", () => {
    expect(claimsPath(["app/**"], "app")).toBe(false);
    expect(claimsPath(["app/**"], "app/x")).toBe(true);
  });

  it("prefix traps: app/** does not leak onto apple/", () => {
    expect(claimsPath(["app/**"], "apple/x.ts")).toBe(false);
    expect(claimsPath(["lib/parser/**"], "lib/parse/x.ts")).toBe(false);
    expect(claimsPath(["lib/parse/**"], "lib/parser/x.ts")).toBe(false);
  });

  it("a fully consumed pattern claims the subtree (gitignore dir claim)", () => {
    expect(claimsPath(["app/test"], "app/test/foo.test.ts")).toBe(true);
    expect(claimsPath(["app/test"], "app/test")).toBe(true);
    expect(claimsPath(["app/test"], "app/testing/foo.ts")).toBe(false);
  });

  it("trailing slash is directory-only", () => {
    expect(claimsPath(["app/test/"], "app/test/foo.ts")).toBe(true);
    expect(claimsPath(["app/test/"], "app/test")).toBe(false);
  });

  it("mid-pattern `**` spans zero or more directories", () => {
    expect(claimsPath(["a/**/b"], "a/b")).toBe(true);
    expect(claimsPath(["a/**/b"], "a/x/b")).toBe(true);
    expect(claimsPath(["a/**/b"], "a/x/y/z/b")).toBe(true);
    expect(claimsPath(["a/**/b"], "a/x/y")).toBe(false);
    // ...and the matched b claims its subtree.
    expect(claimsPath(["a/**/b"], "a/x/b/c.ts")).toBe(true);
  });

  it("directory-only pattern with mid `**` claims files under matched dirs", () => {
    expect(claimsPath(["a/**/b/"], "a/x/b/c.ts")).toBe(true);
    expect(claimsPath(["a/**/b/"], "a/x/b")).toBe(false);
  });

  it("`*` stays within one segment", () => {
    expect(claimsPath(["app/src/*.ts"], "app/src/main.ts")).toBe(true);
    expect(claimsPath(["app/src/*.ts"], "app/src/lib/utils.ts")).toBe(false);
  });

  it("leading ./ and / are stripped from patterns and paths", () => {
    expect(claimsPath(["./app/index.html"], "app/index.html")).toBe(true);
    expect(claimsPath(["/app/index.html"], "app/index.html")).toBe(true);
    expect(claimsPath(["app/index.html"], "./app/index.html")).toBe(true);
  });

  it("empty and degenerate patterns are inert", () => {
    expect(claimsPath([""], "a")).toBe(false);
    expect(claimsPath(["/"], "a")).toBe(false);
    expect(claimsPath(["!"], "a")).toBe(false);
    expect(claimsPath([], "a")).toBe(false);
    expect(claimsPath(["a"], "")).toBe(false);
  });
});

describe("claimsPath: unanchored patterns (no slash)", () => {
  it("matches by segment at any depth", () => {
    expect(claimsPath(["*.ts"], "deep/nested/file.ts")).toBe(true);
    expect(claimsPath(["*.ts"], "file.ts")).toBe(true);
    expect(claimsPath(["*.ts"], "file.tsx")).toBe(false);
  });

  it("a bare name claims files inside any matching directory", () => {
    expect(claimsPath(["dist"], "app/dist/bundle.js")).toBe(true);
    expect(claimsPath(["dist"], "dist")).toBe(true);
    expect(claimsPath(["dist"], "distro/x.js")).toBe(false);
  });

  it("bare `app` is NOT a prefix wildcard (the T-008 trap)", () => {
    expect(claimsPath(["app"], "apple/x.ts")).toBe(false);
    expect(claimsPath(["app"], "app/x.ts")).toBe(true);
  });

  it("unanchored + trailing slash requires a directory hit", () => {
    expect(claimsPath(["dist/"], "app/dist/bundle.js")).toBe(true);
    expect(claimsPath(["dist/"], "dist")).toBe(false);
  });

  it("`**` alone claims everything", () => {
    expect(claimsPath(["**"], "any/path/at/all.ts")).toBe(true);
    expect(claimsPath(["**"], "top.ts")).toBe(true);
  });
});

describe("claimsPath: negation (last match wins)", () => {
  it("a later negation un-claims", () => {
    expect(claimsPath(["app/**", "!app/test/**"], "app/test/x.ts")).toBe(false);
    expect(claimsPath(["app/**", "!app/test/**"], "app/src/x.ts")).toBe(true);
  });

  it("a later positive re-claims", () => {
    expect(
      claimsPath(["app/**", "!app/test/**", "app/test/keep.ts"], "app/test/keep.ts"),
    ).toBe(true);
  });

  it("negation alone never claims", () => {
    expect(claimsPath(["!app/**"], "app/x.ts")).toBe(false);
    expect(claimsPath(["!app/**"], "lib/x.ts")).toBe(false);
  });
});

describe("claimingPattern", () => {
  it("reports the deciding pattern text as declared", () => {
    expect(claimingPattern(["app/index.html", "lib/parser/**"], "lib/parser/x.ts")).toBe(
      "lib/parser/**",
    );
    expect(claimingPattern(["./app/**"], "app/x.ts")).toBe("./app/**");
  });

  it("returns undefined when the list does not claim", () => {
    expect(claimingPattern(["app/**", "!app/test/**"], "app/test/x.ts")).toBeUndefined();
    expect(claimingPattern(["app/**"], "lib/x.ts")).toBeUndefined();
  });
});

describe("claimsDirContents (the package.path ownership probe)", () => {
  it("`dir/**` owns the directory it spans", () => {
    expect(claimsDirContents(["lib/parser/**"], "lib/parser")).toBe(true);
    expect(claimsDirContents(["lib/parser/**"], "lib")).toBe(false);
    expect(claimsDirContents(["lib/parser/**"], "lib/parse")).toBe(false);
  });

  it("an ancestor subtree claim owns nested directories", () => {
    expect(claimsDirContents(["app/**"], "app/src/lib")).toBe(true);
    expect(claimsDirContents(["app/src"], "app/src/components")).toBe(true);
  });

  it("a literal file pattern owns no directory", () => {
    expect(claimsDirContents(["app/index.html"], "app")).toBe(false);
    expect(claimsDirContents(["app/src/lib/utils.ts"], "app/src/lib")).toBe(false);
  });

  it("hostile pattern/path content stays inert", () => {
    expect(claimsDirContents(["__proto__/**"], "__proto__")).toBe(true);
    expect(claimsDirContents(["a/**"], "")).toBe(false);
  });
});
