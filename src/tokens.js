export const C = {
  // ── Backgrounds (dark to light) ──────────────────────────────────
  canvas:      "#050505",   // page background — near-void
  card:        "#0A0A0A",   // card surface
  elevated:    "#121212",   // hover state, raised panels, chips
  deep:        "#080808",   // inputs, sunken wells

  // ── Borders ──────────────────────────────────────────────────────
  border:      "rgba(255, 255, 255, 0.05)",   // default card / input border
  border2:     "rgba(255, 255, 255, 0.15)",   // hover / focus border step-up
  hairline:    "rgba(255, 255, 255, 0.03)",   // dividers, section separators

  // ── Dark Electric Blue (primary accent) ──────────────────────────
  blue:        "#FFFFFF",   // primary high-contrast button background
  blueHover:   "#EBEBEB",   // primary button hover
  blueLight:   "#FFFFFF",   // text labels, active states
  blueBright:  "#FFFFFF",   // emphasis, selected indicator dots
  blueDim:     "rgba(255, 255, 255, 0.05)", // background tint (5% opacity white)
  blueGlow:    "rgba(255, 255, 255, 0.08)", // box-shadow glow (8% opacity white)
  blueDeep:    "#121212",   // orb base fill, deep pools

  // ── Faded / Red (wrong calls, settled-faded) ──────────────────────
  faded:       "#D93050",   // border, icon, badge color
  fadedBright: "#FF3D5A",   // emphasis, error text
  fadedDim:    "rgba(217, 48, 80, 0.08)", // background tint
  fadedGlow:   "rgba(217, 48, 80, 0.12)", // box-shadow glow

  // ── Gold (capital / USDC) ─────────────────────────────────────────
  gold:        "#B8902A",   // border, icon
  goldBright:  "#E6C15C",   // text, values (lighter gold for visibility)
  goldDim:     "rgba(184, 144, 42, 0.08)", // background tint
  goldGlow:    "rgba(184, 144, 42, 0.12)", // box-shadow glow

  // ── Text ──────────────────────────────────────────────────────────
  text:        "#F5F5F5",   // primary text
  sub:         "rgba(255, 255, 255, 0.4)",   // secondary / label text
  faint:       "rgba(255, 255, 255, 0.15)",   // disabled, placeholder, locked states

  // ── Tier Colors ───────────────────────────────────────────────────
  tierSteward:     "#B8902A",   // gold
  tierArbiter:     "#E6C15C",   // high-contrast gold/light
  tierAnalyst:     "#FFFFFF",   // pure white
  tierContributor: "rgba(255, 255, 255, 0.4)",   // muted slate
  tierNovice:      "rgba(255, 255, 255, 0.1)",   // near-invisible
};

export const FONTS = {
  display: "'Space Grotesk', sans-serif",
  body:    "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
