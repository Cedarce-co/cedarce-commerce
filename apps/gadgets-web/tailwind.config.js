/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@cedarce/config/tailwind.preset.js")],
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
};
