import { LIMITS } from "../data/diary.js";

const LOOKS = {
  Beef: ["from-red-50 to-rose-50", "border-red-200", "hover:border-red-400", "from-red-400 to-rose-500", "fa-drumstick-bite"],
  Chicken: ["from-amber-50 to-orange-50", "border-amber-200", "hover:border-amber-400", "from-amber-400 to-orange-500", "fa-drumstick-bite"],
  Dessert: ["from-pink-50 to-rose-50", "border-pink-200", "hover:border-pink-400", "from-pink-400 to-rose-500", "fa-cake-candles"],
  Lamb: ["from-orange-50 to-amber-50", "border-orange-200", "hover:border-orange-400", "from-orange-400 to-amber-500", "fa-drumstick-bite"],
  Miscellaneous: ["from-slate-50 to-gray-50", "border-slate-200", "hover:border-slate-400", "from-slate-400 to-gray-500", "fa-bowl-rice"],
  Pasta: ["from-yellow-50 to-amber-50", "border-yellow-200", "hover:border-yellow-400", "from-yellow-400 to-amber-500", "fa-bowl-food"],
  Pork: ["from-rose-50 to-red-50", "border-rose-200", "hover:border-rose-400", "from-rose-400 to-red-500", "fa-bacon"],
  Seafood: ["from-cyan-50 to-blue-50", "border-cyan-200", "hover:border-cyan-400", "from-cyan-400 to-blue-500", "fa-fish"],
  Side: ["from-green-50 to-emerald-50", "border-green-200", "hover:border-green-400", "from-green-400 to-emerald-500", "fa-plate-wheat"],
  Starter: ["from-teal-50 to-cyan-50", "border-teal-200", "hover:border-teal-400", "from-teal-400 to-cyan-500", "fa-utensils"],
  Vegan: ["from-emerald-50 to-green-50", "border-emerald-200", "hover:border-emerald-400", "from-emerald-400 to-green-500", "fa-leaf"],
  Vegetarian: ["from-lime-50 to-green-50", "border-lime-200", "hover:border-lime-400", "from-lime-400 to-green-500", "fa-seedling"]
};

const SHOWN = ["Beef", "Chicken", "Dessert", "Lamb", "Miscellaneous", "Pasta", "Pork", "Seafood", "Side", "Starter", "Vegan", "Vegetarian"];

const SCORE = {
  a: "bg-green-500",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-500"
};

const NOVA = {
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-amber-500",
  4: "bg-red-500"
};

const BARS = [
  ["Protein", "protein", "bg-emerald-500", 50],
  ["Carbs", "carbs", "bg-blue-500", 250],
  ["Fat", "fat", "bg-purple-500", 65],
  ["Fiber", "fiber", "bg-orange-500", 28],
  ["Sugar", "sugar", "bg-pink-500", 50],
  ["Saturated Fat", "saturatedFat", "bg-red-500", 20]
];

function safe(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function num(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function short(value) {
  const amount = num(value);
  if (amount >= 100) return String(Math.round(amount));
  const rounded = Math.round(amount * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function share(value, goal) {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, Math.round((num(value) / goal) * 100)));
}

function stepsOf(meal) {
  if (Array.isArray(meal.instructions)) {
    return meal.instructions.map((line) => String(line || "").trim()).filter(Boolean);
  }
  return String(meal.instructions || "")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function clip(meal) {
  const text = stepsOf(meal).join(" ").replace(/\s+/g, " ").trim();
  if (!text) return "Delicious recipe to try!";
  return text.length > 100 ? `${text.slice(0, 100)}...` : text;
}

function video(url) {
  const match = String(url || "").match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

export class Paint {
  spin() {
    return `
      <div class="flex items-center justify-center py-16 wide">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    `;
  }

  blank(title, text, icon = "fa-search", actionId = "", actionLabel = "") {
    const action = actionId
      ? `<button id="${actionId}" type="button" class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all">${safe(actionLabel)}</button>`
      : "";
    return `
      <div class="flex flex-col items-center justify-center py-12 text-center wide">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
        </div>
        <p class="text-gray-500 text-lg">${safe(title)}</p>
        <p class="text-gray-400 text-sm mt-2">${safe(text)}</p>
        ${action}
      </div>
    `;
  }

  groups(list) {
    const names = new Map((list || []).map((group) => [group.name, group]));
    return SHOWN
      .filter((name) => names.has(name))
      .map((name) => {
        const look = LOOKS[name];
        return `
          <div class="category-card bg-gradient-to-br ${look[0]} rounded-xl p-3 border ${look[1]} ${look[2]} hover:shadow-md cursor-pointer transition-all group" data-kind="${safe(name)}">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 bg-gradient-to-br ${look[3]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <i class="fa-solid ${look[4]} text-sm text-white"></i>
              </div>
              <h3 class="text-sm font-bold text-gray-900">${safe(name)}</h3>
            </div>
          </div>
        `;
      })
      .join("");
  }

  meal(meal) {
    const area = meal.area
      ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg"><i class="fa-solid fa-globe mr-1 text-blue-600"></i>${safe(meal.area)}</span>`
      : "";
    return `
      <article class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal="${safe(meal.id)}">
        <div class="recipe-media relative h-48 overflow-hidden bg-gray-100">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${safe(meal.thumbnail)}" alt="${safe(meal.name)}" loading="lazy">
          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-lg"><i class="fa-solid fa-tag mr-1 text-emerald-600"></i>${safe(meal.category || "Meal")}</span>
            ${area}
          </div>
        </div>
        <div class="recipe-body p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${safe(meal.name)}</h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">${safe(clip(meal))}</p>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${safe(meal.category || "Various")}</span>
            <span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${safe(meal.area || "International")}</span>
          </div>
        </div>
      </article>
    `;
  }

  sheet(meal, pack) {
    const lines = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    const steps = stepsOf(meal);
    const embed = video(meal.youtube);
    const tags = (Array.isArray(meal.tags) ? meal.tags : []).slice(0, 2);
    const each = pack?.perServing;
    const servings = pack?.servings || 4;
    const chips = [
      meal.category ? `<span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${safe(meal.category)}</span>` : "",
      meal.area ? `<span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${safe(meal.area)}</span>` : "",
      ...tags.map((tag) => `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${safe(tag)}</span>`)
    ].join("");
    const items = lines
      .map((item) => {
        return `
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
            <input type="checkbox" class="w-5 h-5 text-emerald-600 rounded border-gray-300">
            <span class="text-gray-700"><span class="font-medium text-gray-900">${safe(item.measure || "")}</span> ${safe(item.ingredient || "")}</span>
          </div>
        `;
      })
      .join("");
    const guide = steps
      .map((step, index) => {
        return `
          <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
            <p class="text-gray-700 leading-relaxed pt-2">${safe(step)}</p>
          </div>
        `;
      })
      .join("");
    const player = embed
      ? `
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><i class="fa-solid fa-video text-red-500"></i>Video Tutorial</h2>
          <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
            <iframe class="absolute inset-0 w-full h-full" src="${embed}" title="${safe(meal.name)} video" allowfullscreen></iframe>
          </div>
        </div>
      `
      : "";
    const source = meal.source
      ? `
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">Recipe Source</h3>
          <a href="${safe(meal.source)}" target="_blank" class="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-2">
            <i class="fa-solid fa-external-link"></i>View Original Recipe
          </a>
        </div>
      `
      : "";
    const log = each
      ? `<button id="log-meal-btn" type="button" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"><i class="fa-solid fa-clipboard-list"></i><span>Log This Meal</span></button>`
      : `<button id="log-meal-btn" type="button" class="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed" disabled><i class="fa-solid fa-spinner fa-spin"></i><span>Calculating...</span></button>`;

    return `
      <div class="max-w-6xl mx-auto">
        <button id="back-to-meals-btn" type="button" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6">
          <i class="fa-solid fa-arrow-left"></i><span>Back to Recipes</span>
        </button>
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div class="relative h-80 md:h-96">
            <img class="w-full h-full object-cover" src="${safe(meal.thumbnail)}" alt="${safe(meal.name)}">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div class="flex items-center gap-3 mb-3 flex-wrap">${chips}</div>
              <h1 class="text-3xl md:text-4xl font-bold mb-2">${safe(meal.name)}</h1>
              <div class="flex items-center gap-6 text-white/90 flex-wrap">
                <span class="flex items-center gap-2"><i class="fa-solid fa-clock"></i><span>30 min</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-utensils"></i><span id="hero-servings">${servings} servings</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-fire"></i><span id="hero-calories">${each ? `${Math.round(num(each.calories))} cal/serving` : "Calculating..."}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 mb-8">${log}</div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <section class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-emerald-600"></i>Ingredients
                <span class="text-sm font-normal text-gray-500 ml-auto">${lines.length} items</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${items}</div>
            </section>
            <section class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-shoe-prints text-emerald-600"></i>Instructions
              </h2>
              <div class="space-y-4">${guide || `<p class="text-gray-500">No instructions were provided for this meal.</p>`}</div>
            </section>
            ${player}
          </div>
          <div class="space-y-6">
            <section class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-chart-pie text-emerald-600"></i>Nutrition Facts
              </h2>
              <div id="nutrition-facts-container">${pack ? this.facts(pack) : this.spin()}</div>
            </section>
            ${source}
          </div>
        </div>
      </div>
    `;
  }

  facts(pack) {
    const each = pack.perServing || {};
    const whole = pack.totals || {};
    const bars = BARS
      .map(([label, key, color, goal]) => {
        return `
          <div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full ${color}"></div>
                <span class="text-gray-700">${label}</span>
              </div>
              <span class="font-bold text-gray-900">${short(each[key])}g</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div class="${color} h-2 rounded-full" style="width: ${share(each[key], goal)}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
    const extra = [
      ["Cholesterol", `${Math.round(num(each.cholesterol))}mg`],
      ["Sodium", `${Math.round(num(each.sodium))}mg`]
    ]
      .map(([label, value]) => `<div class="flex justify-between"><span class="text-gray-600">${label}</span><span class="font-medium">${value}</span></div>`)
      .join("");
    return `
      <p class="text-sm text-gray-500 mb-4">Per serving</p>
      <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
        <p class="text-sm text-gray-600">Calories per serving</p>
        <p class="text-4xl font-bold text-emerald-600">${Math.round(num(each.calories))}</p>
        <p class="text-xs text-gray-500 mt-1">Total: ${Math.round(num(whole.calories))} cal</p>
      </div>
      <div class="space-y-4">${bars}</div>
      <div class="mt-6 pt-6 border-t border-gray-100">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Other</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">${extra}</div>
      </div>
    `;
  }

  fail() {
    return `
      <div class="text-center py-8">
        <i class="fa-solid fa-exclamation-circle text-3xl text-red-400 mb-3"></i>
        <p class="text-gray-600">Unable to load nutrition data</p>
        <button id="retry-nutrition-btn" type="button" class="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          <i class="fa-solid fa-refresh mr-1"></i> Try Again
        </button>
      </div>
    `;
  }

  logSheet(meal, pack) {
    const each = pack?.perServing;
    const facts = each
      ? `
        <div class="bg-emerald-50 rounded-xl p-4 mb-6">
          <p class="text-sm text-gray-600 mb-2">Estimated nutrition per serving:</p>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div><p class="text-lg font-bold text-emerald-600">${Math.round(num(each.calories))}</p><p class="text-xs text-gray-500">Calories</p></div>
            <div><p class="text-lg font-bold text-blue-600">${short(each.protein)}g</p><p class="text-xs text-gray-500">Protein</p></div>
            <div><p class="text-lg font-bold text-amber-600">${short(each.carbs)}g</p><p class="text-xs text-gray-500">Carbs</p></div>
            <div><p class="text-lg font-bold text-purple-600">${short(each.fat)}g</p><p class="text-xs text-gray-500">Fat</p></div>
          </div>
        </div>
      `
      : `<div class="bg-gray-50 rounded-xl p-4 mb-6"><p class="text-sm text-gray-500 text-center">Nutrition information not available for this meal</p></div>`;
    return `
      <div id="log-meal-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div class="flex items-center gap-4 mb-6">
            <img src="${safe(meal.thumbnail)}" alt="${safe(meal.name)}" class="w-16 h-16 rounded-xl object-cover">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Log This Meal</h3>
              <p class="text-gray-500 text-sm">${safe(meal.name)}</p>
            </div>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Servings</label>
            <div class="flex items-center gap-3">
              <button id="decrease-servings" type="button" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-minus text-gray-600"></i></button>
              <input type="number" id="meal-servings" value="1" min="0.5" max="10" step="0.5" class="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2">
              <button id="increase-servings" type="button" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-plus text-gray-600"></i></button>
            </div>
          </div>
          ${facts}
          <div class="flex gap-3">
            <button id="cancel-log-meal" type="button" class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">Cancel</button>
            <button id="confirm-log-meal" type="button" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"><i class="fa-solid fa-clipboard-list mr-2"></i>Log Meal</button>
          </div>
        </div>
      </div>
    `;
  }

  good(item) {
    const grade = String(item.nutritionGrade || "").toLowerCase();
    const badge = SCORE[grade] || "bg-gray-400";
    const letter = SCORE[grade] ? grade.toUpperCase() : "N/A";
    const nova = Number(item.novaGroup);
    const novaHtml = NOVA[nova]
      ? `<div class="absolute top-2 right-2 ${NOVA[nova]} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">${nova}</div>`
      : "";
    const food = item.nutrients || {};
    const photo = item.image
      ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${safe(item.image)}" alt="${safe(item.name)}">`
      : `<i class="fa-solid fa-barcode text-gray-300 text-4xl"></i>`;
    return `
      <article class="good-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-code="${safe(item.barcode)}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          ${photo}
          <div class="absolute top-2 left-2 ${badge} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${letter}</div>
          ${novaHtml}
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${safe(item.brand || "Unbranded")}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600">${safe(item.name || "Product")}</h3>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-fire mr-1"></i>${short(food.calories)} kcal/100g</span>
          </div>
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${short(food.protein)}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
            <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${short(food.carbs)}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
            <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${short(food.fat)}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
            <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${short(food.sugar)}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
          </div>
        </div>
      </article>
    `;
  }

  goodSheet(item) {
    const food = item.nutrients || {};
    const grade = String(item.nutritionGrade || "").toLowerCase();
    const badge = SCORE[grade] || "bg-gray-400";
    const letter = SCORE[grade] ? grade.toUpperCase() : "N/A";
    const photo = item.image
      ? `<img src="${safe(item.image)}" alt="${safe(item.name)}" class="w-full h-48 object-contain bg-gray-50 rounded-xl">`
      : `<div class="w-full h-48 bg-gray-50 rounded-xl flex items-center justify-center"><i class="fa-solid fa-barcode text-4xl text-gray-300"></i></div>`;
    return `
      <div class="sheet">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-sm text-emerald-600 font-semibold">${safe(item.brand || "Unbranded")}</p>
            <h3 class="text-2xl font-bold text-gray-900">${safe(item.name || "Product")}</h3>
            <p class="text-xs text-gray-500 mt-1">Barcode ${safe(item.barcode || "")}</p>
          </div>
          <button id="close-goods" type="button" class="w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${photo}
        <div class="flex items-center gap-2 mt-4">
          <span class="px-3 py-1 ${badge} text-white text-xs font-bold rounded-full">Nutri-Score ${letter}</span>
          ${item.novaGroup ? `<span class="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">NOVA ${safe(item.novaGroup)}</span>` : ""}
        </div>
        <div class="mt-4">
          <label for="gram-box" class="text-sm font-semibold text-gray-700">Amount in grams</label>
          <input id="gram-box" type="number" min="1" step="1" value="100" class="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
          <p class="text-xs text-gray-500 mt-2">Nutrition below is for the amount you enter. Packaged values are stored per 100g.</p>
        </div>
        <div id="gram-preview" class="grid grid-cols-4 gap-2 text-center mt-4">${this.preview(food, 100)}</div>
        <button id="save-good" type="button" class="mt-6 w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700">
          <i class="fa-solid fa-clipboard-list mr-2"></i>Add to Food Log
        </button>
      </div>
    `;
  }

  preview(food, grams) {
    const scale = num(grams) / 100;
    const cells = [
      ["Calories", Math.round(num(food.calories) * scale), "bg-emerald-50", "text-emerald-700"],
      ["Protein", `${short(num(food.protein) * scale)}g`, "bg-blue-50", "text-blue-700"],
      ["Carbs", `${short(num(food.carbs) * scale)}g`, "bg-amber-50", "text-amber-600"],
      ["Fat", `${short(num(food.fat) * scale)}g`, "bg-purple-50", "text-purple-700"]
    ];
    return cells
      .map(([label, value, bg, color]) => `<div class="${bg} rounded-xl p-3"><p class="text-lg font-bold ${color}">${value}</p><p class="text-xs text-gray-500">${label}</p></div>`)
      .join("");
  }

  today(rows, totals) {
    const cards = [
      ["Calories", totals.calories, LIMITS.calories, "kcal", "bg-emerald-50", "bg-emerald-500", totals.calories > LIMITS.calories],
      ["Protein", totals.protein, LIMITS.protein, "g", "bg-blue-50", "bg-blue-500", false],
      ["Carbs", totals.carbs, LIMITS.carbs, "g", "bg-amber-50", "bg-amber-500", false],
      ["Fat", totals.fat, LIMITS.fat, "g", "bg-purple-50", "bg-purple-500", false]
    ];
    const boxes = cards
      .map(([label, value, goal, unit, bg, bar, over]) => {
        const note = label === "Calories" && over
          ? `<p class="text-xs text-red-600 mt-2 font-medium">Over the daily limit</p>`
          : label !== "Calories" && value >= goal
            ? `<p class="text-xs text-green-600 mt-2 font-medium">Goal met</p>`
            : "";
        return `
          <div class="${over ? "bg-red-50" : bg} rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">${label}</span>
              <span class="text-sm text-gray-500">${Math.round(value)} / ${goal} ${unit}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="${over ? "bg-red-500" : bar} h-2.5 rounded-full" style="width: ${share(value, goal)}%"></div>
            </div>
            ${note}
          </div>
        `;
      })
      .join("");
    const banner = totals.calories > LIMITS.calories
      ? `<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium"><i class="fa-solid fa-triangle-exclamation mr-2"></i>You passed today's ${LIMITS.calories} kcal limit.</div>`
      : "";
    const list = rows.length
      ? rows.map((row) => this.line(row)).join("")
      : `
        <div class="text-center py-12">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-utensils text-gray-300 text-3xl"></i>
          </div>
          <p class="text-gray-500 font-medium mb-2">No food logged today</p>
          <p class="text-gray-400 text-sm mb-4">Start tracking your nutrition by logging meals or scanning products</p>
          <div class="flex justify-center gap-3">
            <a href="#meals" data-screen="meals" class="nav-link inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><i class="fa-solid fa-plus"></i>Browse Recipes</a>
            <a href="#products" data-screen="products" class="nav-link inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><i class="fa-solid fa-barcode"></i>Scan Product</a>
          </div>
        </div>
      `;
    return `
      <h3 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-fire text-orange-500 mr-2"></i>Today's Nutrition</h3>
      ${banner}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${boxes}</div>
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-700">Logged Items (${rows.length})</h4>
          <button id="clear-foodlog" type="button" class="text-red-500 hover:text-red-600 text-sm font-medium" style="display:${rows.length ? "inline-flex" : "none"}"><i class="fa-solid fa-trash mr-1"></i>Clear All</button>
        </div>
        <div class="space-y-2">${list}</div>
      </div>
    `;
  }

  line(row) {
    const time = new Date(row.at || Date.now()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const icon = row.kind === "product" ? "fa-barcode" : "fa-utensils";
    const thumb = row.image
      ? `<img src="${safe(row.image)}" alt="" class="w-12 h-12 rounded-lg object-cover">`
      : `<div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><i class="fa-solid ${icon}"></i></div>`;
    return `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        ${thumb}
        <div class="flex-1">
          <p class="font-semibold text-gray-900 text-sm">${safe(row.name)}</p>
          <p class="text-xs text-gray-500">${Math.round(row.calories)} kcal · P ${Math.round(row.protein)}g · C ${Math.round(row.carbs)}g · F ${Math.round(row.fat)}g</p>
          <p class="text-xs text-gray-400">${safe(row.note || "")} · ${time}</p>
        </div>
        <button type="button" class="drop-row text-red-500 hover:text-red-600" data-row="${safe(row.id)}" aria-label="Remove"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }

  week(days) {
    const cells = days
      .map((day) => {
        return `
          <div class="text-center ${day.today ? "bg-indigo-100 rounded-xl" : ""}">
            <p class="text-xs text-gray-500 mb-1">${safe(day.label)}</p>
            <p class="text-sm font-medium text-gray-900">${day.date}</p>
            <div class="mt-2 ${day.calories > 0 ? "text-emerald-600" : "text-gray-300"}">
              <p class="text-lg font-bold">${day.calories}</p>
              <p class="text-xs">kcal</p>
            </div>
            ${day.items > 0 ? `<p class="text-xs text-gray-400 mt-1">${day.items} items</p>` : ""}
          </div>
        `;
      })
      .join("");
    const totalCalories = days.reduce((sum, day) => sum + day.calories, 0);
    const totalItems = days.reduce((sum, day) => sum + day.items, 0);
    const average = totalCalories > 0 ? Math.round(totalCalories / 7) : 0;
    const onGoal = days.filter((day) => day.calories > 0 && day.calories >= LIMITS.calories * 0.8 && day.calories <= LIMITS.calories * 1.2).length;
    const stats = [
      ["Weekly Average", `${average} kcal`, "bg-emerald-100", "text-emerald-600", "fa-chart-line"],
      ["Total Items This Week", `${totalItems} items`, "bg-blue-100", "text-blue-600", "fa-utensils"],
      ["Days On Goal", `${onGoal} / 7`, "bg-purple-100", "text-purple-600", "fa-bullseye"]
    ];
    return {
      grid: `<div class="grid grid-cols-7 gap-2">${cells}</div>`,
      stats: stats
        .map(([label, value, bg, color, icon]) => {
          return `
            <div class="bg-white rounded-xl p-4 border-2 border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 ${bg} rounded-xl flex items-center justify-center"><i class="fa-solid ${icon} ${color} text-xl"></i></div>
                <div>
                  <p class="text-sm text-gray-500">${label}</p>
                  <p class="text-xl font-bold text-gray-900">${value}</p>
                </div>
              </div>
            </div>
          `;
        })
        .join("")
    };
  }
}
