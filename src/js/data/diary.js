const KEY = "kelany-plate-book";

export const LIMITS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65
};

export class Diary {
  constructor() {
    this.box = this.read();
  }

  read() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  write() {
    localStorage.setItem(KEY, JSON.stringify(this.box));
  }

  static stamp(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  static heading(date = new Date()) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
  }

  rows(date = new Date()) {
    const list = this.box[Diary.stamp(date)];
    return Array.isArray(list) ? list : [];
  }

  sum(date = new Date()) {
    return this.rows(date).reduce(
      (bag, row) => {
        bag.calories += Number(row.calories) || 0;
        bag.protein += Number(row.protein) || 0;
        bag.carbs += Number(row.carbs) || 0;
        bag.fat += Number(row.fat) || 0;
        return bag;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  put(row, date = new Date()) {
    const key = Diary.stamp(date);
    const entry = {
      id: `${Date.now()}`,
      at: new Date().toISOString(),
      ...row
    };
    this.box[key] = [entry, ...this.rows(date)];
    this.write();
    return entry;
  }

  drop(id, date = new Date()) {
    const key = Diary.stamp(date);
    this.box[key] = this.rows(date).filter((row) => row.id !== id);
    this.write();
  }

  wipe(date = new Date()) {
    this.box[Diary.stamp(date)] = [];
    this.write();
  }

  week() {
    const days = [];
    for (let back = 6; back >= 0; back -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - back);
      days.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        calories: Math.round(this.sum(date).calories),
        items: this.rows(date).length,
        today: back === 0
      });
    }
    return days;
  }
}
