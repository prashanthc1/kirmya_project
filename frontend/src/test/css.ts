/**
 * Resolving a rendered element's styles at a chosen viewport width.
 *
 * jsdom has no layout engine and never evaluates a media query, so
 * `getComputedStyle` reports the same thing at every width. These helpers read
 * the stylesheet Emotion generated for the component instead and apply the
 * `@media (min-width: …)` blocks by hand, which is enough to answer the
 * question the responsive tests ask: at 390px does this element stack, and at
 * 1280px does it sit side by side.
 *
 * What this does not do is lay anything out. It shows which declarations win at
 * a width, not what the browser then paints.
 */

/** Widths the responsive tests use, in the terms MUI's breakpoints are set in. */
export const VIEWPORT = {
  /** Below `sm` (600): a phone held upright. */
  phone: 390,
  /** Between `sm` and `md`: a small tablet. */
  tablet: 768,
  /** Above `lg` (1200): a laptop. */
  laptop: 1280,
} as const;

/**
 * True when every width constraint in a media condition holds at `width`.
 * A condition carrying anything else — `print`, `prefers-*`, orientation — is
 * treated as not applying, so no rule is claimed to be in force on a guess.
 */
const conditionHolds = (condition: string, width: number): boolean => {
  const constraints = Array.from(condition.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g));
  if (constraints.length === 0) return false;

  const stripped = condition.replace(/\((min|max)-width:\s*[\d.]+px\)/g, '').replace(/[\s,]|and/g, '');
  if (stripped.length > 0) return false;

  return constraints.every(([, bound, value]) =>
    bound === 'min' ? width >= Number(value) : width <= Number(value)
  );
};

const matchesSafely = (element: Element, selector: string): boolean => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

const merge = (into: Record<string, string>, declaration: CSSStyleDeclaration) => {
  for (let index = 0; index < declaration.length; index += 1) {
    // Declarations parsed out of a stylesheet come from `cssom`, which exposes
    // property names by index but has no `item()`. The ones on an element come
    // from `cssstyle`, which has both.
    const property =
      (declaration as unknown as Record<number, string>)[index] ??
      (typeof declaration.item === 'function' ? declaration.item(index) : '');
    if (property) into[property] = declaration.getPropertyValue(property);
  }
};

const collect = (
  rules: CSSRuleList,
  element: Element,
  width: number,
  into: Record<string, string>
) => {
  Array.from(rules).forEach((rule) => {
    if (rule.type === CSSRule.STYLE_RULE) {
      const styleRule = rule as CSSStyleRule;
      if (matchesSafely(element, styleRule.selectorText)) merge(into, styleRule.style);
      return;
    }
    if (rule.type === CSSRule.MEDIA_RULE) {
      const mediaRule = rule as CSSMediaRule;
      if (conditionHolds(mediaRule.media.mediaText, width)) {
        collect(mediaRule.cssRules, element, width, into);
      }
    }
  });
};

/**
 * The declarations that apply to `element` at a viewport of `width` pixels,
 * keyed by CSS property. Rules are read in source order, which is the order
 * MUI emits breakpoints in, so the widest matching breakpoint wins.
 */
export const styleAt = (element: Element, width: number): Record<string, string> => {
  const resolved: Record<string, string> = {};

  Array.from(document.styleSheets).forEach((sheet) => {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      return; // A sheet the document may not read. Nothing of ours lands there.
    }
    collect(rules, element, width, resolved);
  });

  // The element's own `style` attribute beats every sheet.
  merge(resolved, (element as HTMLElement).style);
  return resolved;
};
