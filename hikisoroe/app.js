// ---- マスタ（あなたのWP版をそのまま移植） ----
const yarnMaster = {
  lace: { min_m_per_g: 6.0, max_m_per_g: 8.0, example_m: 700, example_g: 100 },
  fingering: { min_m_per_g: 3.6, max_m_per_g: 4.6, example_m: 400, example_g: 100 },
  sport: { min_m_per_g: 3.0, max_m_per_g: 3.6, example_m: 330, example_g: 100 },
  dk: { min_m_per_g: 2.4, max_m_per_g: 2.8, example_m: 260, example_g: 100 },
  worsted: { min_m_per_g: 2.0, max_m_per_g: 2.4, example_m: 220, example_g: 100 },
  aran: { min_m_per_g: 1.6, max_m_per_g: 1.8, example_m: 170, example_g: 100 },
  bulky: { min_m_per_g: 1.0, max_m_per_g: 1.3, example_m: 110, example_g: 100 },
  super_bulky: { min_m_per_g: 0.0, max_m_per_g: 1.0, example_m: 80, example_g: 100 },
};

const candidateYarns = [
  { name: "Lace (極細)", m_per_g: 7.0 },
  { name: "Fingering (中細)", m_per_g: 4.0 },
  { name: "Sport (合太)", m_per_g: 3.2 },
  { name: "DK (並太)", m_per_g: 2.7 },
  { name: "Worsted (極太)", m_per_g: 2.2 },
  { name: "Aran (極太)", m_per_g: 1.8 },
  { name: "Bulky (超極太)", m_per_g: 1.3 },
  { name: "Super Bulky (超極太)", m_per_g: 0.8 },
];

// ---- 組み合わせ生成（重複あり、順序なし） ----
function combinationsWithReplacement(array, length) {
  const results = [];
  function backtrack(combo, start) {
    if (combo.length === length) {
      results.push(combo);
      return;
    }
    for (let i = start; i < array.length; i++) {
      backtrack(combo.concat(array[i]), i);
    }
  }
  backtrack([], 0);
  return results;
}

// ---- 提案ロジック（あなたのWP版をほぼそのまま） ----
function getStrandSuggestions(targetDensity, yarns, maxStrands, tolerance = 0.5, comboRule = "any") {
  const suggestions = [];

  const yarnsWithGm = yarns.map(yarn => ({
    ...yarn,
    g_per_m: 1 / yarn.m_per_g
  }));

  for (let r = 2; r <= maxStrands; r++) {
    const combos = combinationsWithReplacement(yarnsWithGm, r);
    for (const combo of combos) {
      const sumGperM = combo.reduce((sum, yarn) => sum + yarn.g_per_m, 0);
      const avgDensity = 1 / sumGperM;

      if (Math.abs(avgDensity - targetDensity) <= tolerance) {
        const names = combo.map(y => y.name);
        const unique = [...new Set(names)];

        if (comboRule === "same" && unique.length > 1) continue;
        if (comboRule === "diff" && unique.length < r) continue;

        suggestions.push({
          names: names.join(" + "),
          avgDensity: avgDensity,
          strands: r
        });
      }
    }
  }

  return suggestions.sort(
    (a, b) => Math.abs(a.avgDensity - targetDensity) - Math.abs(b.avgDensity - targetDensity)
  );
}

// ---- UI wiring ----
const select = document.getElementById("yarn_weight");
const lengthInput = document.getElementById("length");
const weightInput = document.getElementById("weight");
const densityInput = document.getElementById("density");
const calculateBtn = document.getElementById("calculate-btn");
const resultsList = document.getElementById("results-list");
const maxStrandsInput = document.getElementById("max_strands");
const comboRuleSelect = document.getElementById("combo_rule");

function updateDensity() {
  const m = parseFloat(lengthInput.value);
  const g = parseFloat(weightInput.value);
  densityInput.value = (m > 0 && g > 0) ? (m / g).toFixed(2) : "";
}

function updateResults() {
  const density = parseFloat(densityInput.value);
  const maxStrands = parseInt(maxStrandsInput.value, 10);
  const comboRule = comboRuleSelect.value;

  if (!density || density <= 0) {
    resultsList.innerHTML = "<li>糸の長さと重さを入力してください。</li>";
    return;
  }

  const suggestions = getStrandSuggestions(density, candidateYarns, maxStrands, 0.5, comboRule);

  resultsList.innerHTML = suggestions.length
    ? suggestions.map(s => `<li>${s.names}（合成: ${s.avgDensity.toFixed(2)} m/g）</li>`).join("")
    : "<li>適切な組み合わせは見つかりませんでした。</li>";
}

select.addEventListener("change", () => {
  const val = select.value;
  if (val && yarnMaster[val]) {
    lengthInput.value = yarnMaster[val].example_m;
    weightInput.value = yarnMaster[val].example_g;
    updateDensity();
  }
});

lengthInput.addEventListener("input", updateDensity);
weightInput.addEventListener("input", updateDensity);
calculateBtn.addEventListener("click", updateResults);
