/**
 * Extracts the favicon URL from the current page.
 * Includes full debugging logs.
 */
export function getFaviconUrl(debug = true): string | null {
  try {
    const log = (...args: any[]) => debug && console.log("[FAVICON]", ...args);

    log("Starting favicon detection…");

    // Method 1: Apple touch icon
    const appleTouchIcon = document.querySelector<HTMLLinkElement>(
      'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
    );
    if (appleTouchIcon?.href) {
      log("Found Apple touch icon:", appleTouchIcon.href);
      return appleTouchIcon.href;
    }
    log("No apple-touch-icon found.");

    // Method 2: Largest icon with size
    const sizeIcons = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"][sizes]')
    );

    if (sizeIcons.length > 0) {
      log("Icons with sizes found:", sizeIcons.map(i => i.href));

      // Pick largest size
      const best = sizeIcons
        .map(icon => ({
          href: icon.href,
          size: parseInt(icon.getAttribute("sizes")?.split("x")[0] || "0")
        }))
        .sort((a, b) => b.size - a.size)[0];

      log("Best sized icon chosen:", best.href);
      return best.href;
    }
    log("No sized icons found.");

    // Method 3: Standard icon / shortcut icon
    const standardIcon = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]'
    );
    if (standardIcon?.href) {
      log("Found standard icon:", standardIcon.href);
      return standardIcon.href;
    }
    log("No standard icon found.");

    // Method 4: Default /favicon.ico
    const fallback = `${window.location.origin}/favicon.ico`;
    log("Using fallback favicon:", fallback);

    return fallback;
  } catch (error) {
    console.error("[FAVICON] Error:", error);
    return null;
  }
}

/**
 * Gets the site name from meta tags or title.
 * Adds debugging logs.
 */
export function getSiteName(debug = true): string {
  try {
    const log = (...args: any[]) => debug && console.log("[SITENAME]", ...args);

    log("Starting site name detection…");

    // Method 1: og:site_name
    const og = document.querySelector<HTMLMetaElement>(
      'meta[property="og:site_name"]'
    );
    if (og?.content) {
      log("Found og:site_name:", og.content);
      return og.content;
    }
    log("No og:site_name found.");

    // Method 2: application-name
    const app = document.querySelector<HTMLMetaElement>(
      'meta[name="application-name"]'
    );
    if (app?.content) {
      log("Found application-name:", app.content);
      return app.content;
    }
    log("No application-name found.");

    // Method 3: title fallback
    const cleanTitle = document.title.split("|")[0].split("-")[0].trim();
    log("Using title fallback:", cleanTitle);

    return cleanTitle || window.location.hostname;
  } catch (error) {
    console.error("[SITENAME] Error:", error);
    return window.location.hostname;
  }
}
