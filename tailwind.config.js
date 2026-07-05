/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        k8s: {
          blue: "#326ce5",
          darker: "var(--k8s-bg)",
          dark: "var(--k8s-bg-secondary)",
          surface: "var(--k8s-surface)",
          border: "var(--k8s-border)",
          text: "var(--k8s-text)",
          muted: "var(--k8s-muted)",
          link: "var(--k8s-link)",
          linkHover: "var(--k8s-link-hover)",
          "gradient-from": "var(--k8s-gradient-from)",
          "gradient-to": "var(--k8s-gradient-to)",
          "accent-gradient-from": "var(--k8s-accent-gradient-from)",
          "accent-gradient-to": "var(--k8s-accent-gradient-to)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
