import { plugin } from "bun";

// Handle CSS imports in test context (no bundler)
plugin({
  name: "css-noop",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({
      contents: "",
      loader: "js",
    }));
  },
});
