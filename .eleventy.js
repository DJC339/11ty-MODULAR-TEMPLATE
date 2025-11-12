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
    let raw = value;
    if (raw === undefined || raw === null || raw === '' || raw === 'now') {
      raw = new Date();
    }
    const date = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(date)) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const LL = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());

    // Backwards compatibility for old token formats
    if (typeof localeOrFormat === "string") {
      const fmt = localeOrFormat;
      if (fmt === "yyyy-LL-dd") return `${yyyy}-${LL}-${dd}`;
      if (fmt === "yyyy-LL") return `${yyyy}-${LL}`;
      if (fmt === "LL/dd/yyyy") return `${LL}/${dd}/${yyyy}`;
    }

    // Intl path
    let locale;
    if (typeof localeOrFormat === "string" && localeOrFormat && localeOrFormat !== "auto") {
      locale = localeOrFormat; // e.g., 'en-GB', 'fr-FR'
    } // else undefined -> system default

    let options = { dateStyle: "medium" };
    if (typeof styleOrOptions === "string") {
      options = { dateStyle: styleOrOptions }; // 'short'|'medium'|'long'|'full'
    } else if (styleOrOptions && typeof styleOrOptions === "object") {
      options = styleOrOptions; // any Intl.DateTimeFormat options
    }

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (e) {
      return date.toISOString();
    }
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
