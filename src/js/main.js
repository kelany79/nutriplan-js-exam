import { Client } from "./net/client.js";
import { Diary, LIMITS } from "./data/diary.js";
import { Paint } from "./view/paint.js";

const TITLES = {
  meals: ["Meals & Recipes", "Discover delicious and nutritious recipes tailored for you"],
  meal: ["Recipe Details", "View full recipe information and nutrition facts"],
  products: ["Product Scanner", "Search packaged foods by name or barcode"],
  foodlog: ["Food Log", "Track your daily nutrition and food intake"]
};

const GRADE_IDLE = {
  "": "bg-gray-100 text-gray-700 hover:bg-gray-200",
  a: "bg-green-100 text-green-700 hover:bg-green-200",
  b: "bg-lime-100 text-lime-700 hover:bg-lime-200",
  c: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  d: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  e: "bg-red-100 text-red-700 hover:bg-red-200"
};

const CHIP_ON = "px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all";
const CHIP_OFF = "px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all";

class Lane {
  constructor(onMove) {
    this.onMove = onMove;
  }

  boot() {
    window.addEventListener("hashchange", () => this.onMove(this.now()));
    if (!location.hash) history.replaceState(null, "", "#meals");
    this.onMove(this.now());
  }

  now() {
    const text = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (text.startsWith("meal/")) return { page: "meal", ref: text.slice(5) };
    if (text === "products" || text === "foodlog") return { page: text, ref: "" };
    return { page: "meals", ref: "" };
  }

  jump(page, ref = "") {
    const next = ref ? `meal/${encodeURIComponent(ref)}` : page;
    if (location.hash === `#${next}`) {
      this.onMove(this.now());
      return;
    }
    location.hash = next;
  }
}

class Board {
  constructor() {
    this.client = new Client();
    this.diary = new Diary();
    this.paint = new Paint();
    this.lane = new Lane((spot) => this.open(spot));
    this.kind = "";
    this.place = "";
    this.word = "";
    this.meals = [];
    this.known = new Map();
    this.goods = [];
    this.knownGoods = new Map();
    this.opened = "";
    this.openedGood = "";
    this.facts = new Map();
    this.grade = "";
    this.gradeOn = false;
    this.note = null;
    this.ticket = 0;
    this.timer = 0;
    this.ready = false;
    this.layout = "grid";
  }

  boot() {
    this.grab();
    this.listen();
    this.paintGrades();
    this.lane.boot();
  }

  grab() {
    this.placeRow = document.getElementById("place-row");
    this.groupBox = document.getElementById("categories-grid");
    this.mealBox = document.getElementById("recipes-grid");
    this.mealCount = document.getElementById("recipes-count");
    this.finder = document.getElementById("search-input");
    this.detail = document.getElementById("meal-details");
    this.goodBox = document.getElementById("products-grid");
    this.goodCount = document.getElementById("products-count");
    this.goodFinder = document.getElementById("product-search-input");
    this.codeBox = document.getElementById("barcode-input");
    this.todayBox = document.getElementById("foodlog-today-section");
    this.dayLabel = document.getElementById("foodlog-date");
    this.chart = document.getElementById("weekly-chart");
    this.stats = document.getElementById("foodlog-stats");
    this.gridButton = document.getElementById("grid-view-btn");
    this.listButton = document.getElementById("list-view-btn");
    this.heading = document.querySelector("#header h1");
    this.subline = document.querySelector("#header p");
  }

  listen() {
    document.addEventListener("click", (event) => this.tap(event));
    this.finder.addEventListener("input", () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.findMeals(), 350);
    });
    this.goodFinder.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.findGoods();
    });
    this.codeBox.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.findCode();
    });
  }

  async open(spot) {
    this.screen(spot.page);
    try {
      if (spot.page === "meal") await this.showMeal(spot.ref);
      else if (spot.page === "meals" && !this.ready) await this.home();
      else if (spot.page === "products" && this.goods.length === 0 && !this.note) this.drawGoods();
      else if (spot.page === "foodlog") this.drawDiary();
    } finally {
      this.hideCover();
    }
  }

  screen(page) {
    const mealsOn = page === "meals";
    document.getElementById("search-filters-section").style.display = mealsOn ? "" : "none";
    document.getElementById("meal-categories-section").style.display = mealsOn ? "" : "none";
    document.getElementById("all-recipes-section").style.display = mealsOn ? "" : "none";
    this.detail.style.display = page === "meal" ? "block" : "none";
    document.getElementById("products-section").style.display = page === "products" ? "block" : "none";
    document.getElementById("foodlog-section").style.display = page === "foodlog" ? "block" : "none";
    const [title, text] = TITLES[page] || TITLES.meals;
    this.heading.textContent = title;
    this.subline.textContent = text;
    document.querySelectorAll("#sidebar .nav-link").forEach((link) => {
      const on = link.dataset.screen === (page === "meal" ? "meals" : page);
      link.className = on
        ? "nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg"
        : "nav-link flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg";
    });
    window.scrollTo(0, 0);
  }

  async home() {
    await Promise.all([this.loadGroups(), this.loadPlaces(), this.loadMeals()]);
    this.ready = true;
  }

  async loadGroups() {
    try {
      const payload = await this.client.groups();
      this.groupBox.innerHTML = this.paint.groups(payload.results || []);
      this.icons(this.groupBox);
    } catch {
      this.groupBox.innerHTML = this.paint.blank("Categories are unavailable", "Check your connection and try again");
    }
  }

  async loadPlaces() {
    let names = [];
    try {
      const payload = await this.client.places();
      names = (payload.results || []).map((item) => item.name).filter(Boolean).slice(0, 10);
    } catch {
      names = [];
    }
    const buttons = [`<button type="button" class="${this.place ? CHIP_OFF : CHIP_ON}" data-place="">All Cuisines</button>`];
    names.forEach((name) => {
      const label = name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
      buttons.push(`<button type="button" class="${this.place === name ? CHIP_ON : CHIP_OFF}" data-place="${label}">${label}</button>`);
    });
    this.placeRow.innerHTML = buttons.join("");
  }

  async loadMeals() {
    const ticket = ++this.ticket;
    this.mealCount.textContent = "Loading recipes...";
    this.mealBox.innerHTML = this.paint.spin();
    try {
      let payload;
      if (this.word) payload = await this.client.meals(this.word);
      else if (this.kind) payload = await this.client.byKind(this.kind);
      else if (this.place) payload = await this.client.byPlace(this.place);
      else payload = await this.client.meals("chicken");
      if (ticket !== this.ticket) return;
      this.meals = (payload.results || []).slice(0, 25);
      this.meals.forEach((meal) => {
        if (meal?.id) this.known.set(String(meal.id), meal);
      });
      this.drawMeals();
    } catch {
      if (ticket !== this.ticket) return;
      this.mealCount.textContent = "Could not load recipes";
      this.mealBox.innerHTML = this.paint.blank("Recipes are unavailable", "Check your connection and try again", "fa-search", "show-every-meal", "Try again");
      this.icons(this.mealBox);
    }
  }

  drawMeals() {
    const count = this.meals.length;
    const noun = count === 1 ? "recipe" : "recipes";
    if (!count) this.mealCount.textContent = "No recipes found";
    else if (this.word) this.mealCount.textContent = `Showing ${count} ${noun} for "${this.word}"`;
    else if (this.kind) this.mealCount.textContent = `Showing ${count} ${this.kind} ${noun}`;
    else if (this.place) this.mealCount.textContent = `Showing ${count} ${this.place} ${noun}`;
    else this.mealCount.textContent = `Showing ${count} ${noun}`;
    this.mealBox.classList.toggle("rows", this.layout === "list");
    this.mealBox.innerHTML = count
      ? this.meals.map((meal) => this.paint.meal(meal)).join("")
      : this.paint.blank("No recipes found", "Try another name, category, or area", "fa-search", "show-every-meal", "Show all recipes");
    this.icons(this.mealBox);
  }

  findMeals() {
    this.word = this.finder.value.trim();
    if (this.word) {
      this.kind = "";
      this.place = "";
    }
    this.loadPlaces();
    this.loadGroups();
    this.loadMeals();
  }

  pickKind(name) {
    this.kind = this.kind === name ? "" : name;
    this.place = "";
    this.word = "";
    this.finder.value = "";
    this.loadPlaces();
    this.loadGroups();
    this.loadMeals();
  }

  pickPlace(name) {
    this.place = name;
    this.kind = "";
    this.word = "";
    this.finder.value = "";
    this.loadPlaces();
    this.loadGroups();
    this.loadMeals();
  }

  resetMeals() {
    this.kind = "";
    this.place = "";
    this.word = "";
    this.finder.value = "";
    this.loadPlaces();
    this.loadGroups();
    this.loadMeals();
  }

  setLayout(layout) {
    this.layout = layout;
    this.gridButton.className = layout === "grid" ? "px-3 py-1.5 bg-white rounded-md shadow-sm" : "px-3 py-1.5";
    this.listButton.className = layout === "list" ? "px-3 py-1.5 bg-white rounded-md shadow-sm" : "px-3 py-1.5";
    this.gridButton.querySelector("i").className = layout === "grid" ? "fa-solid fa-table-cells text-gray-700" : "fa-solid fa-table-cells text-gray-500";
    this.listButton.querySelector("i").className = layout === "list" ? "fa-solid fa-list text-gray-700" : "fa-solid fa-list text-gray-500";
    this.drawMeals();
  }

  async showMeal(id) {
    this.opened = String(id);
    let meal = this.known.get(String(id));
    if (!meal) {
      this.detail.innerHTML = this.paint.spin();
      try {
        meal = (await this.client.oneMeal(id)).result;
        if (meal?.id) this.known.set(String(meal.id), meal);
      } catch {
        meal = null;
      }
    }
    if (this.opened !== String(id)) return;
    if (!meal) {
      this.detail.innerHTML = this.paint.blank("Meal not found", "Go back and pick another recipe", "fa-search", "back-to-meals-btn", "Back to recipes");
      this.icons(this.detail);
      return;
    }
    const pack = this.facts.get(String(meal.id)) || null;
    this.detail.innerHTML = this.paint.sheet(meal, pack);
    this.icons(this.detail);
    if (!pack) this.fillFacts(meal);
  }

  async fillFacts(meal) {
    const lines = (meal.ingredients || [])
      .map((item) => `${item.measure || ""} ${item.ingredient || ""}`.trim())
      .filter(Boolean);
    let pack = null;
    for (let tryNo = 0; tryNo < 2; tryNo += 1) {
      try {
        pack = await this.client.facts(meal.name, lines);
        break;
      } catch {
        pack = null;
      }
    }
    if (this.opened !== String(meal.id)) return;
    const box = document.getElementById("nutrition-facts-container");
    if (!box) return;
    if (!pack) {
      box.innerHTML = this.paint.fail();
      this.icons(box);
      const button = document.getElementById("log-meal-btn");
      if (button) {
        button.disabled = true;
        button.className = "flex items-center gap-2 px-6 py-3 bg-red-100 text-red-500 rounded-xl font-semibold cursor-not-allowed";
        button.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i><span>Unavailable</span>`;
        this.icons(button);
      }
      return;
    }
    this.facts.set(String(meal.id), pack);
    box.innerHTML = this.paint.facts(pack);
    this.icons(box);
    this.applyHero(pack);
  }

  applyHero(pack) {
    const servings = document.getElementById("hero-servings");
    const calories = document.getElementById("hero-calories");
    if (servings) servings.textContent = `${pack.servings || 1} servings`;
    if (calories) calories.textContent = `${Math.round(Math.max(0, Number(pack.perServing?.calories) || 0))} cal/serving`;
    const button = document.getElementById("log-meal-btn");
    if (!button) return;
    button.disabled = false;
    button.className = "flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all";
    button.innerHTML = `<i class="fa-solid fa-clipboard-list"></i><span>Log This Meal</span>`;
    this.icons(button);
  }

  logMeal() {
    const meal = this.known.get(this.opened);
    const pack = this.facts.get(this.opened);
    if (!meal || !pack || document.getElementById("log-meal-modal")) return;
    document.body.insertAdjacentHTML("beforeend", this.paint.logSheet(meal, pack));
    this.icons(document.getElementById("log-meal-modal"));
  }

  changeServings(step) {
    const input = document.getElementById("meal-servings");
    if (!input) return;
    const next = Math.round((parseFloat(input.value) + step) * 10) / 10;
    if (next < 0.5 || next > 10) return;
    input.value = Number.isInteger(next) ? String(next) : next.toFixed(1);
  }

  confirmLog() {
    const meal = this.known.get(this.opened);
    const input = document.getElementById("meal-servings");
    if (!meal || !input) return;
    const servings = parseFloat(input.value) || 1;
    const each = this.facts.get(this.opened)?.perServing;
    document.getElementById("log-meal-modal")?.remove();
    this.keep({
      kind: "meal",
      name: meal.name,
      image: meal.thumbnail || "",
      note: `${servings} serving${servings === 1 ? "" : "s"}`,
      servings,
      calories: Math.round(Math.max(0, Number(each?.calories) || 0) * servings),
      protein: Math.round(Math.max(0, Number(each?.protein) || 0) * servings),
      carbs: Math.round(Math.max(0, Number(each?.carbs) || 0) * servings),
      fat: Math.round(Math.max(0, Number(each?.fat) || 0) * servings)
    });
  }

  async findGoods() {
    const word = this.goodFinder.value.trim();
    if (!word) {
      await Swal.fire({
        icon: "info",
        title: "Type a product name",
        text: "Try Pepsi, Nutella, or Cheerios.",
        confirmButtonColor: "#059669"
      });
      return;
    }
    this.grade = "";
    this.gradeOn = false;
    this.note = { type: "search", label: word };
    this.paintGrades();
    this.goodCount.textContent = "Searching...";
    this.goodBox.innerHTML = this.paint.spin();
    try {
      const payload = await this.client.findGoods(word);
      this.keepGoods(payload.results || []);
      this.drawGoods();
    } catch {
      this.goodCount.textContent = "Could not load products";
      this.goodBox.innerHTML = this.paint.blank("Search failed", "Try the product name again");
      this.icons(this.goodBox);
    }
  }

  async findCode() {
    const code = this.codeBox.value.trim();
    if (!/^\d{6,}$/.test(code)) {
      await Swal.fire({
        icon: "error",
        title: "Enter a valid barcode",
        text: "Use the digits printed under the barcode.",
        confirmButtonColor: "#059669"
      });
      return;
    }
    this.goodCount.textContent = "Looking up barcode...";
    this.goodBox.innerHTML = this.paint.spin();
    try {
      const item = (await this.client.goodsByCode(code)).result;
      if (!item) throw new Error("missing");
      this.keepGoods([item]);
      this.grade = "";
      this.gradeOn = false;
      this.note = { type: "barcode", label: code };
      this.paintGrades();
      this.drawGoods();
      this.openGood(item.barcode);
    } catch {
      this.goods = [];
      this.goodCount.textContent = "No product found";
      this.goodBox.innerHTML = this.paint.blank("Barcode not found", "Check the number and try again");
      this.icons(this.goodBox);
    }
  }

  async goodsOf(kind) {
    this.note = { type: "category", label: String(kind || "").replaceAll("_", " ") };
    this.goodFinder.value = "";
    this.goodCount.textContent = "Loading products...";
    this.goodBox.innerHTML = this.paint.spin();
    try {
      const payload = await this.client.goodsByKind(kind);
      this.keepGoods(payload.results || []);
      this.drawGoods();
    } catch {
      this.goods = [];
      this.drawGoods();
    }
  }

  keepGoods(list) {
    this.goods = list;
    list.forEach((item) => {
      if (item?.barcode) this.knownGoods.set(String(item.barcode), item);
    });
  }

  shownGoods() {
    if (!this.grade) return this.goods;
    return this.goods.filter((item) => String(item.nutritionGrade || "").toLowerCase() === this.grade);
  }

  drawGoods() {
    const list = this.shownGoods();
    const note = this.note;
    const empty = this.paint.blank("No products to display", "Search for a product or browse by category", "fa-box-open");
    if (!this.goods.length) {
      if (note?.type === "category") this.goodCount.textContent = `No products found in ${note.label}`;
      else if (note?.type === "search") this.goodCount.textContent = `No products found for "${note.label}"`;
      else this.goodCount.textContent = "Search for products to see results";
      this.goodBox.innerHTML = empty;
    } else if (!list.length) {
      this.goodCount.textContent = "No products for this Nutri-Score";
      this.goodBox.innerHTML = empty;
    } else if (note?.type === "category") {
      this.goodCount.textContent = `Found ${list.length} products in ${note.label}`;
      this.goodBox.innerHTML = list.map((item) => this.paint.good(item)).join("");
    } else if (note?.type === "search") {
      this.goodCount.textContent = `Found ${list.length} products for "${note.label}"`;
      this.goodBox.innerHTML = list.map((item) => this.paint.good(item)).join("");
    } else {
      this.goodCount.textContent = `Found ${list.length} products`;
      this.goodBox.innerHTML = list.map((item) => this.paint.good(item)).join("");
    }
    this.icons(this.goodBox);
  }

  paintGrades() {
    document.querySelectorAll(".nutri-score-filter").forEach((button) => {
      const grade = button.dataset.grade || "";
      const ring = this.gradeOn && grade === this.grade ? " ring-2 ring-gray-900" : "";
      button.className = `nutri-score-filter px-4 py-2 rounded-lg text-sm font-bold transition-all ${GRADE_IDLE[grade]}${ring}`;
    });
  }

  pickGrade(grade) {
    this.grade = grade;
    this.gradeOn = true;
    this.paintGrades();
    this.drawGoods();
  }

  openGood(code) {
    const item = this.knownGoods.get(String(code));
    if (!item) return;
    this.openedGood = String(code);
    let layer = document.getElementById("goods-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "goods-layer";
      document.body.appendChild(layer);
    }
    layer.innerHTML = this.paint.goodSheet(item);
    layer.classList.add("open");
    this.icons(layer);
    const grams = layer.querySelector("#gram-box");
    const preview = layer.querySelector("#gram-preview");
    grams.addEventListener("input", () => {
      preview.innerHTML = this.paint.preview(item.nutrients || {}, Math.max(0, Number(grams.value) || 0));
    });
  }

  closeGood() {
    document.getElementById("goods-layer")?.classList.remove("open");
  }

  async saveGood() {
    const item = this.knownGoods.get(this.openedGood);
    const grams = Number(document.getElementById("gram-box")?.value);
    if (!item || !Number.isInteger(grams) || grams < 1) {
      await Swal.fire({ icon: "error", title: "Enter the amount in grams", confirmButtonColor: "#059669" });
      return;
    }
    const food = item.nutrients || {};
    const scale = grams / 100;
    this.closeGood();
    await this.keep({
      kind: "product",
      name: item.name,
      image: item.image || "",
      note: `${grams} g`,
      calories: Math.round((Number(food.calories) || 0) * scale),
      protein: Math.round((Number(food.protein) || 0) * scale),
      carbs: Math.round((Number(food.carbs) || 0) * scale),
      fat: Math.round((Number(food.fat) || 0) * scale)
    });
  }

  async keep(row) {
    const before = this.diary.sum().calories;
    this.diary.put(row);
    const after = this.diary.sum().calories;
    this.drawDiary();
    if (before <= LIMITS.calories && after > LIMITS.calories) {
      await Swal.fire({
        icon: "warning",
        title: "Calorie limit reached",
        text: `${row.name} was added. Today is now over the ${LIMITS.calories} kcal limit.`,
        confirmButtonColor: "#059669"
      });
      return;
    }
    if (row.kind === "meal") {
      const servings = row.servings || 1;
      await Swal.fire({
        title: "Meal Logged!",
        html: `<p class="text-gray-600">${row.name} (${servings} serving${servings === 1 ? "" : "s"}) has been added to your daily log.</p>${row.calories > 0 ? `<p class="text-emerald-600 font-semibold mt-2">+${row.calories} calories</p>` : ""}`,
        icon: "success",
        confirmButtonColor: "#10b981",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }
    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Added to today's food log",
      showConfirmButton: false,
      timer: 1700
    });
  }

  drawDiary() {
    const rows = this.diary.rows();
    const totals = this.diary.sum();
    this.dayLabel.textContent = Diary.heading();
    this.todayBox.innerHTML = this.paint.today(rows, totals);
    this.icons(this.todayBox);
    const board = this.paint.week(this.diary.week());
    this.chart.className = "";
    this.chart.style.height = "";
    this.chart.innerHTML = board.grid;
    if (this.stats) {
      this.stats.innerHTML = board.stats;
      this.icons(this.stats);
    }
  }

  async clearDiary() {
    const answer = await Swal.fire({
      title: "Clear today's log?",
      text: "This removes every item logged today.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear all",
      confirmButtonColor: "#dc2626"
    });
    if (!answer.isConfirmed) return;
    this.diary.wipe();
    this.drawDiary();
  }

  tap(event) {
    const link = event.target.closest("a.nav-link");
    if (link?.dataset.screen) {
      event.preventDefault();
      this.lane.jump(link.dataset.screen);
      return;
    }
    const place = event.target.closest("[data-place]");
    if (place && this.placeRow.contains(place)) {
      this.pickPlace(place.dataset.place);
      return;
    }
    const kind = event.target.closest(".category-card");
    if (kind && this.groupBox.contains(kind)) {
      this.pickKind(kind.dataset.kind || kind.dataset.category);
      return;
    }
    if (event.target.closest("#show-every-meal")) {
      this.resetMeals();
      return;
    }
    if (event.target.closest("#grid-view-btn")) {
      this.setLayout("grid");
      return;
    }
    if (event.target.closest("#list-view-btn")) {
      this.setLayout("list");
      return;
    }
    const card = event.target.closest(".recipe-card");
    if (card?.dataset.meal) {
      this.lane.jump("meal", card.dataset.meal);
      return;
    }
    if (event.target.closest("#back-to-meals-btn")) {
      this.lane.jump("meals");
      return;
    }
    const logButton = event.target.closest("#log-meal-btn");
    if (logButton) {
      if (logButton.disabled) return;
      this.logMeal();
      return;
    }
    if (event.target.closest("#retry-nutrition-btn")) {
      const meal = this.known.get(this.opened);
      if (meal) this.fillFacts(meal);
      return;
    }
    if (event.target.closest("#decrease-servings")) {
      this.changeServings(-0.5);
      return;
    }
    if (event.target.closest("#increase-servings")) {
      this.changeServings(0.5);
      return;
    }
    if (event.target.closest("#cancel-log-meal")) {
      document.getElementById("log-meal-modal")?.remove();
      return;
    }
    if (event.target.id === "log-meal-modal") {
      event.target.remove();
      return;
    }
    if (event.target.closest("#confirm-log-meal")) {
      this.confirmLog();
      return;
    }
    if (event.target.closest("#search-product-btn")) {
      this.findGoods();
      return;
    }
    if (event.target.closest("#lookup-barcode-btn")) {
      this.findCode();
      return;
    }
    const grade = event.target.closest(".nutri-score-filter");
    if (grade) {
      this.pickGrade(grade.dataset.grade || "");
      return;
    }
    const goodsKind = event.target.closest(".product-category-btn");
    if (goodsKind) {
      this.goodsOf(goodsKind.dataset.category || "");
      return;
    }
    const good = event.target.closest(".good-card");
    if (good) {
      this.openGood(good.dataset.code);
      return;
    }
    if (event.target.id === "goods-layer" || event.target.closest("#close-goods")) {
      this.closeGood();
      return;
    }
    if (event.target.closest("#save-good")) {
      this.saveGood();
      return;
    }
    const drop = event.target.closest(".drop-row");
    if (drop) {
      this.diary.drop(drop.dataset.row);
      this.drawDiary();
      return;
    }
    if (event.target.closest("#clear-foodlog")) {
      this.clearDiary();
    }
  }

  icons(node) {
    if (window.FontAwesome?.dom?.i2svg) window.FontAwesome.dom.i2svg({ node });
  }

  hideCover() {
    const cover = document.getElementById("app-loading-overlay");
    if (!cover || cover.dataset.done) return;
    cover.dataset.done = "1";
    cover.style.opacity = "0";
    setTimeout(() => {
      cover.style.display = "none";
    }, 400);
  }
}

new Board().boot();
