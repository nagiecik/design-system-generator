# Design System Generator — Figma Plugin 🎨

A comprehensive and powerful Figma plugin created by **me&my Friends** to automatically generate and maintain a complete, production-ready Design System token architecture in Figma Variables and Styles.

---

## ✨ Features

### 🎨 1. Full Semantic Color System & 5 Color Modes
* **Primitives & Shades:** Generates raw tonal palettes (0–100) and alpha shades (`shadesLight`, `shadesDark`, `shadesPrimary`, etc.) with customizable opacity steps.
* **5 Native Color Modes:**
  * ☀️ **Light**
  * 🔍 **Light Contrast**
  * 🌙 **Dark**
  * 🕶️ **Dark Contrast**
  * ♿ **Accessibility** (high-contrast WCAG AAA compliance)
* **Semantic Roles:** Automatic alias binding for `surface`, `onSurface`, `canvas`, `outline`, `focus`, `elevation`, `highlight`, and functional states (`action`, `success`, `warning`, `error`).

### ⚡ 2. Dynamic WCAG 2.1 Contrast Detection
* Automatically calculates relative luminance and WCAG contrast ratios in real time.
* If a primary/secondary/tertiary base color is too bright (e.g. Neon Cyan `#00FFFF`, Bright Yellow, Lime), the plugin automatically adapts the `onXXXDefault` token to a dark tone ensuring $ge 4.5:1$ (WCAG AA/AAA compliance).

### 🔤 3. Typography System & Text Styles
* Complete semantic typography scale: **Display**, **Headline**, **Title**, **Body**, **Label**.
* Supports font family selection, weights (`regular`, `medium`, `bold`), and text decorations.
* Native support for Figma's new **Text Wrap Style** (`BALANCE`, `AUTO`, `PRETTY`) configurable for Display and Default text styles.
* Binds numeric variables for `fontSize`, `lineHeight`, `letterSpacing`, `paragraphSpacing`, and `paragraphIndent`.

### 📐 4. Layout Grids & Metrics
* Generates responsive grid styles across breakpoints (`xs`, `sm`, `md`, `lg`, `xl`).
* Semantic layout metrics for spacing, corner radius presets, padding, and screen limits.

### 🔮 5. Glassmorphism & Elevation Effects
* Multi-layer elevation and shadow styles.
* Glass effect styles with blur, specular highlights, and surface reflection.

### 📋 6. Developer Control Collections (`_schemesControls`)
* Automatically creates string-based readout variables (HEX values, short token codes like `p-50`, `n-90`) for instant token inspection and dev handoff.

---

## 🚀 Installation & Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/nagiecik/design-system-generator.git
   ```
2. Open **Figma Desktop App**.
3. Go to **Plugins** -> **Development** -> **Import plugin from manifest...**.
4. Select the `manifest.json` file from this repository.
5. Run the plugin via **Plugins** -> **Development** -> **me&my Friends - design system generator**.

---

## 📁 Project Structure

```text
design-system-generator/
├── manifest.json   # Figma plugin manifest
├── code.js         # Main plugin backend logic (Figma Plugin API)
├── index.html      # Plugin UI interface & styling
├── .gitignore      # Git ignore rules
└── README.md       # Documentation
```

---

## 📄 License

Created with ❤️ by **Me & My Friends S.A.**
