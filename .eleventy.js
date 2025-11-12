const path = require("path");
const Image = require("@11ty/eleventy-img");

const DEFAULT_DATE_STYLE = Object.freeze({ dateStyle: "medium" });
const pad2 = (n) => String(n).padStart(2, "0");
const LEGACY_DATE_FORMATTERS = Object.freeze({
  "yyyy-LL-dd": (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
  "yyyy-LL": (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`,
  "LL/dd/yyyy": (date) => `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`,
});
const formatterCache = new Map();
const TARGET_BLANK_REGEX = /<a([^>]*?)target=("|')_blank\2([^>]*)>/gi;
const REL_ATTRIBUTE_REGEX = /\srel=("|')(.*?)\1/i;

module.exports = function (eleventyConfig) {
  // Copy assets to the output as-is
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Internationalized date filter using Intl.DateTimeFormat
  // Usage examples (Nunjucks):
  //   {{ date | date() }}                         -> system locale, medium date
  //   {{ date | date('auto','long') }}           -> system locale, long date
  //   {{ date | date('en-GB','medium') }}        -> en-GB locale, medium date
  //   {{ date | date('fr-FR', { dateStyle: 'full' }) }}
  //   {{ date | date('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}
  // Back-compat: if first arg is 'yyyy-LL-dd' | 'yyyy-LL' | 'LL/dd/yyyy',
  // it formats using those tokens to avoid breaking existing templates.
  eleventyConfig.addFilter("date", (value, localeOrFormat = "auto", styleOrOptions) => {
    const date = coerceDate(value);
    if (!date) return "";

    const legacyFormatted = formatLegacyDate(date, localeOrFormat);
    if (legacyFormatted) return legacyFormatted;

    const { locale, options } = normalizeIntlArgs(localeOrFormat, styleOrOptions);

    try {
      return getFormatter(locale, options).format(date);
    } catch {
      return date.toISOString();
    }
  });

  // Markdown image defaults: lazy-load and async decode to improve performance
  eleventyConfig.amendLibrary("md", (mdLib) => {
    const defaultImageRule = mdLib.renderer.rules.image;
    mdLib.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      setTokenAttr(token, "loading", "lazy");
      setTokenAttr(token, "decoding", "async");
      return (defaultImageRule || self.renderToken)(tokens, idx, options);
    };
  });

  // Responsive image shortcode using @11ty/eleventy-img
  // Usage in templates/Markdown (Nunjucks enabled):
  //   {% img '/assets/images/example.jpg', 'Alt text', '(min-width: 768px) 720px, 100vw' %}
  eleventyConfig.addNunjucksAsyncShortcode(
    "img",
    async function imgShortcode(
      src,
      alt = "",
      sizes = "(min-width: 768px) 720px, 100vw",
      widths = [320, 640, 960, 1280, 1920],
      formats = ["avif", "webp", "jpeg"],
      className = ""
    ) {
      const inputDir = "src"; // matches dir.input below
      const rel = String(src).replace(/^\//, "");
      const fullSrc = path.join(inputDir, rel);

      const metadata = await Image(fullSrc, {
        widths,
        formats,
        urlPath: "/assets/images/",
        outputDir: path.join("_site", "assets", "images"),
        filenameFormat: function (id, source, width, format) {
          const name = path.basename(source, path.extname(source));
          return `${name}-${width}.${format}`;
        },
      });

      const imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
        class: className,
      };
      return Image.generateHTML(metadata, imageAttributes);
    }
  );

  // Pre-generate a default social image at build time (JPEG 1200px wide)
  eleventyConfig.on("eleventy.before", async () => {
    const source = path.join("src", "assets", "images", "social-share.svg");
    try {
      await Image(source, {
        widths: [1200],
        formats: ["jpeg"],
        urlPath: "/assets/images/",
        outputDir: path.join("_site", "assets", "images"),
        filenameFormat: () => "social-share.jpg",
      });
    } catch (e) {
      // If source is missing, skip silently; user can replace later
    }
  });

  // Helpers
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    try {
      if (!path) return base || "";
      if (!base) return path;
      return new URL(path, base).toString();
    } catch {
      return path;
    }
  });

  eleventyConfig.addFilter("w3cDate", (value) => {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return "";
    return d.toISOString();
  });

  // Transform: add rel="noopener noreferrer" to external links that open in a new tab
  eleventyConfig.addTransform("secure-external-links", (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      return hardenExternalLinks(content);
    }
    return content;
  });

  return {
    templateFormats: ["md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};

function coerceDate(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "" || rawValue === "now") {
    return new Date();
  }

  if (rawValue instanceof Date) {
    const copy = new Date(rawValue.getTime());
    return isNaN(copy) ? null : copy;
  }

  const parsed = new Date(rawValue);
  return isNaN(parsed) ? null : parsed;
}

function formatLegacyDate(date, maybeToken) {
  if (typeof maybeToken !== "string") return null;
  const formatter = LEGACY_DATE_FORMATTERS[maybeToken];
  return formatter ? formatter(date) : null;
}

function normalizeIntlArgs(localeOrFormat, styleOrOptions) {
  const locale =
    typeof localeOrFormat === "string" && localeOrFormat && localeOrFormat !== "auto"
      ? localeOrFormat
      : undefined;

  if (typeof styleOrOptions === "string" && styleOrOptions) {
    return { locale, options: { dateStyle: styleOrOptions } };
  }

  if (styleOrOptions && typeof styleOrOptions === "object") {
    return { locale, options: { ...styleOrOptions } };
  }

  return { locale, options: { ...DEFAULT_DATE_STYLE } };
}

function getFormatter(locale, options) {
  const cacheKey = `${locale || "system"}|${JSON.stringify(options)}`;
  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(cacheKey, new Intl.DateTimeFormat(locale, options));
  }
  return formatterCache.get(cacheKey);
}

function setTokenAttr(token, name, value) {
  const idx = token.attrIndex(name);
  if (idx >= 0) {
    token.attrs[idx][1] = value;
  } else {
    token.attrPush([name, value]);
  }
}

function hardenExternalLinks(html) {
  TARGET_BLANK_REGEX.lastIndex = 0;
  return html.replace(TARGET_BLANK_REGEX, (match) => {
    REL_ATTRIBUTE_REGEX.lastIndex = 0;
    const relMatch = REL_ATTRIBUTE_REGEX.exec(match);
    if (!relMatch) {
      return match.replace(/<a\b/i, '<a rel="noopener noreferrer"');
    }

    const [, quote, relValue] = relMatch;
    const mergedRel = Array.from(
      new Set(
        relValue
          .split(/\s+/)
          .filter(Boolean)
          .concat(["noopener", "noreferrer"])
      )
    ).join(" ");

    REL_ATTRIBUTE_REGEX.lastIndex = 0;
    return match.replace(REL_ATTRIBUTE_REGEX, ` rel=${quote}${mergedRel}${quote}`);
  });
}
