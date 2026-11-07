export class Client {
  constructor() {
    this.root = "https://nutriplan-api.vercel.app/api";
    this.key = "xRGnhxcXrKuX8hJpeeQE5Rac9b7dyQDpaMs5fWFL";
  }

  async call(path, extra = {}) {
    const response = await fetch(`${this.root}${path}`, extra);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = payload.error?.message || payload.message || "Request failed";
      throw new Error(typeof reason === "string" ? reason : "Request failed");
    }
    return payload;
  }

  groups() {
    return this.call("/meals/categories");
  }

  places() {
    return this.call("/meals/areas");
  }

  meals(word) {
    const query = new URLSearchParams({ q: word || "", limit: "25" });
    return this.call(`/meals/search?${query}`);
  }

  byKind(kind) {
    const query = new URLSearchParams({ category: kind, limit: "25" });
    return this.call(`/meals/filter?${query}`);
  }

  byPlace(place) {
    const query = new URLSearchParams({ area: place, limit: "25" });
    return this.call(`/meals/filter?${query}`);
  }

  oneMeal(id) {
    return this.call(`/meals/${encodeURIComponent(id)}`);
  }

  async facts(title, lines) {
    const payload = await this.call("/nutrition/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.key
      },
      body: JSON.stringify({ recipeName: title, ingredients: lines })
    });
    if (!payload.success || !payload.data) throw new Error("No nutrition");
    return payload.data;
  }

  findGoods(word) {
    const query = new URLSearchParams({ q: word, limit: "24" });
    return this.call(`/products/search?${query}`);
  }

  goodsByCode(code) {
    return this.call(`/products/barcode/${encodeURIComponent(code)}`);
  }

  async goodsByKind(kind) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/category/${encodeURIComponent(kind)}.json?page=1&page_size=24`);
      if (!response.ok) return { results: [] };
      const data = await response.json();
      const results = (data.products || []).map((item) => ({
        barcode: item.code || item._id || "",
        name: item.product_name || item.product_name_en || "Unknown Product",
        brand: item.brands || "",
        image: item.image_front_url || item.image_url || "",
        nutritionGrade: item.nutrition_grades || item.nutrition_grade_fr || "",
        novaGroup: item.nova_group || "",
        nutrients: {
          calories: item.nutriments?.["energy-kcal_100g"] || 0,
          protein: item.nutriments?.proteins_100g || 0,
          carbs: item.nutriments?.carbohydrates_100g || 0,
          fat: item.nutriments?.fat_100g || 0,
          sugar: item.nutriments?.sugars_100g || 0
        }
      }));
      return { results };
    } catch {
      return { results: [] };
    }
  }
}
