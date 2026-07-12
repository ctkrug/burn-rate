import { costPerSecond, totalBurned, formatCurrency } from "./calc.js";

// Scaffold bootstrap: proves the static page, the module graph, and the
// calculation helpers all wire together end to end. The real ticker (Start
// button, pause/resume, URL-shared state) lands in the build phase per
// docs/BACKLOG.md.
function renderPlaceholder() {
  const digits = document.getElementById("ticker-digits");
  const rate = costPerSecond(10, 120000);
  digits.textContent = formatCurrency(totalBurned(rate, 0));
}

renderPlaceholder();
