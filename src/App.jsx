
import React, { useEffect, useMemo, useState } from "react";
import { Package, Plus, Minus, Search, AlertTriangle, History, X, Save, Trash2, RotateCcw } from "lucide-react";

const initialProducts = [
  { id: 1, name: "עט כדורי כחול", barcode: "729000000001", category: "כלי כתיבה", stock: 120, minStock: 30 },
  { id: 2, name: "מחברת שורות A4", barcode: "729000000002", category: "מחברות ונייר", stock: 22, minStock: 25 },
  { id: 3, name: "דפי צילום A4", barcode: "729000000003", category: "מחברות ונייר", stock: 45, minStock: 15 },
  { id: 4, name: "טוש סימון צהוב", barcode: "729000000004", category: "כלי כתיבה", stock: 8, minStock: 20 },
  { id: 5, name: "סוללות AA", barcode: "729000000005", category: "סוללות", stock: 34, minStock: 20 },
];

const load = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [products, setProducts] = useState(() => load("office-products", initialProducts));
  const [movements, setMovements] = useState(() => load("office-movements", []));
  const [tab, setTab] = useState("inventory");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ productId: "", quantity: 1, employee: "", note: "" });
  const [newItem, setNewItem] = useState({ name: "", barcode: "", category: "כלי כתיבה", stock: 0, minStock: 10 });

  useEffect(() => localStorage.setItem("office-products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("office-movements", JSON.stringify(movements)), [movements]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.category.toLowerCase().includes(q));
  }, [products, query]);

  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  const notify = (message) => {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("opacity-0", "translate-y-3");
    setTimeout(() => el.classList.add("opacity-0", "translate-y-3"), 1800);
  };

  const openMovement = (type, productId = "") => {
    setForm({ productId: String(productId), quantity: 1, employee: "", note: "" });
    setDialog(type);
  };

  const saveMovement = () => {
    const id = Number(form.productId);
    const qty = Number(form.quantity);
    const product = products.find((p) => p.id === id);
    if (!product || !Number.isFinite(qty) || qty <= 0 || !form.employee.trim()) {
      notify("יש למלא מוצר, כמות ושם עובד");
      return;
    }
    if (dialog === "out" && qty > product.stock) {
      notify("אין מספיק מלאי לביצוע ההוצאה");
      return;
    }
    const change = dialog === "in" ? qty : -qty;
    setProducts((items) => items.map((p) => p.id === id ? { ...p, stock: p.stock + change } : p));
    setMovements((items) => [{
      id: Date.now(),
      product: product.name,
      productId: id,
      type: dialog,
      quantity: qty,
      employee: form.employee.trim(),
      note: form.note.trim(),
      date: new Date().toLocaleString("he-IL"),
    }, ...items]);
    setDialog(null);
    notify(dialog === "in" ? "המלאי נקלט בהצלחה" : "המלאי הוצא בהצלחה");
  };

  const addProduct = () => {
    if (!newItem.name.trim() || !newItem.barcode.trim()) {
      notify("יש למלא שם מוצר וברקוד");
      return;
    }
    if (products.some((p) => p.barcode === newItem.barcode.trim())) {
      notify("הברקוד כבר קיים במערכת");
      return;
    }
    const product = {
      id: Date.now(),
      name: newItem.name.trim(),
      barcode: newItem.barcode.trim(),
      category: newItem.category,
      stock: Math.max(0, Number(newItem.stock) || 0),
      minStock: Math.max(0, Number(newItem.minStock) || 0),
    };
    setProducts((items) => [...items, product]);
    setNewItem({ name: "", barcode: "", category: "כלי כתיבה", stock: 0, minStock: 10 });
    setDialog(null);
    notify("המוצר נוסף בהצלחה");
  };

  const removeProduct = (id) => {
    setProducts((items) => items.filter((p) => p.id !== id));
    notify("המוצר נמחק");
  };

  const resetDemo = () => {
    setProducts(initialProducts);
    setMovements([]);
    localStorage.removeItem("office-products");
    localStorage.removeItem("office-movements");
    notify("נתוני ההדגמה אופסו");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-3"><Package size={25} /></div>
            <div><h1 className="text-xl font-bold sm:text-2xl">ניהול מלאי ציוד משרדי</h1><p className="text-sm text-slate-300">מחסן הרצליה</p></div>
          </div>
          <button onClick={resetDemo} className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"><RotateCcw size={16} /> איפוס</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat title="סוגי מוצרים" value={products.length} icon={<Package />} color="blue" />
          <Stat title="יחידות במלאי" value={totalUnits} icon={<Save />} color="emerald" />
          <Stat title="מלאי נמוך" value={lowStock.length} icon={<AlertTriangle />} color="amber" />
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => openMovement("out")} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-4 font-bold text-white shadow hover:bg-rose-700 sm:flex-none"><Minus /> הוצאת מלאי</button>
          <button onClick={() => openMovement("in")} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 font-bold text-white shadow hover:bg-emerald-700 sm:flex-none"><Plus /> קליטת מלאי</button>
          <button onClick={() => setDialog("new")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white shadow hover:bg-blue-700 sm:w-auto"><Package /> מוצר חדש</button>
        </section>

        <nav className="mt-6 flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
          <Tab active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Package size={18} />} text="מלאי" />
          <Tab active={tab === "alerts"} onClick={() => setTab("alerts")} icon={<AlertTriangle size={18} />} text={`התראות (${lowStock.length})`} />
          <Tab active={tab === "history"} onClick={() => setTab("history")} icon={<History size={18} />} text="היסטוריה" />
        </nav>

        {tab === "inventory" && <>
          <div className="relative mt-5"><Search className="absolute right-4 top-3.5 text-slate-400" size={20} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש לפי מוצר, קטגוריה או ברקוד" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-12 pl-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          <div className="mt-4 grid gap-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} onIn={() => openMovement("in", p.id)} onOut={() => openMovement("out", p.id)} onDelete={() => removeProduct(p.id)} />)}
            {!filtered.length && <Empty text="לא נמצאו מוצרים" />}
          </div>
        </>}

        {tab === "alerts" && <div className="mt-5 grid gap-3">{lowStock.map((p) => <ProductCard key={p.id} product={p} onIn={() => openMovement("in", p.id)} onOut={() => openMovement("out", p.id)} onDelete={() => removeProduct(p.id)} />)}{!lowStock.length && <Empty text="אין כרגע התראות מלאי נמוך" />}</div>}

        {tab === "history" && <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          {movements.map((m) => <div key={m.id} className="flex flex-col gap-2 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{m.type === "in" ? "קליטה" : "הוצאה"}</span><strong>{m.product}</strong></div><p className="mt-1 text-sm text-slate-500">{m.employee}{m.note ? ` · ${m.note}` : ""}</p></div><div className="text-left"><strong className={m.type === "in" ? "text-emerald-600" : "text-rose-600"}>{m.type === "in" ? "+" : "-"}{m.quantity}</strong><p className="text-xs text-slate-400">{m.date}</p></div></div>)}
          {!movements.length && <Empty text="עדיין אין תנועות מלאי" />}
        </div>}
      </main>

      {dialog && <Modal title={dialog === "new" ? "הוספת מוצר חדש" : dialog === "in" ? "קליטת מלאי" : "הוצאת מלאי"} onClose={() => setDialog(null)}>
        {dialog === "new" ? <div className="grid gap-4">
          <Field label="שם המוצר"><input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="input" placeholder="לדוגמה: עט כדורי כחול" /></Field>
          <Field label="ברקוד"><input value={newItem.barcode} onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })} className="input" placeholder="סריקה או הקלדה" /></Field>
          <Field label="קטגוריה"><select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="input"><option>כלי כתיבה</option><option>מחברות ונייר</option><option>סוללות</option><option>אביזרי שולחן</option><option>אחר</option></select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="מלאי התחלתי"><input type="number" min="0" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })} className="input" /></Field><Field label="סף מלאי נמוך"><input type="number" min="0" value={newItem.minStock} onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })} className="input" /></Field></div>
          <button onClick={addProduct} className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700">שמור מוצר</button>
        </div> : <div className="grid gap-4">
          <Field label="מוצר"><select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input"><option value="">בחר מוצר</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} · במלאי {p.stock}</option>)}</select></Field>
          <Field label="כמות"><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" /></Field>
          <Field label="שם העובד"><input value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} className="input" placeholder="מי ביצע את הפעולה?" /></Field>
          <Field label="הערה"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" placeholder="מיקום, מחלקה או סיבה" /></Field>
          <button onClick={saveMovement} className={`rounded-xl px-4 py-3 font-bold text-white ${dialog === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>אישור הפעולה</button>
        </div>}
      </Modal>}

      <div id="toast" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 translate-y-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white opacity-0 shadow-xl transition-all" />
      <style>{`.input{width:100%;border:1px solid #cbd5e1;border-radius:.75rem;padding:.75rem;outline:none;background:white}.input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px #dbeafe}`}</style>
    </div>
  );
}

function Stat({ title, value, icon, color }) {
  const colors = { blue: "bg-blue-100 text-blue-700", emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700" };
  return <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"><div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-black">{value}</p></div></div>;
}

function Tab({ active, onClick, icon, text }) { return <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{icon}{text}</button>; }

function ProductCard({ product, onIn, onOut, onDelete }) {
  const low = product.stock <= product.minStock;
  return <div className={`rounded-2xl border bg-white p-4 shadow-sm ${low ? "border-amber-300" : "border-transparent"}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{product.name}</h3>{low && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">מלאי נמוך</span>}</div><p className="mt-1 text-sm text-slate-500">{product.category} · ברקוד {product.barcode}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="pl-2 text-center"><p className={`text-2xl font-black ${low ? "text-amber-600" : "text-slate-900"}`}>{product.stock}</p><p className="text-xs text-slate-400">מינימום {product.minStock}</p></div><button onClick={onIn} title="קליטה" className="rounded-xl bg-emerald-100 p-3 text-emerald-700 hover:bg-emerald-200"><Plus size={19} /></button><button onClick={onOut} title="הוצאה" className="rounded-xl bg-rose-100 p-3 text-rose-700 hover:bg-rose-200"><Minus size={19} /></button><button onClick={onDelete} title="מחיקה" className="rounded-xl bg-slate-100 p-3 text-slate-500 hover:bg-slate-200"><Trash2 size={18} /></button></div></div></div>;
}

function Modal({ title, children, onClose }) { return <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" onMouseDown={onClose}><div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onMouseDown={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button onClick={onClose} className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200"><X /></button></div>{children}</div></div>; }
function Field({ label, children }) { return <label className="grid gap-1.5 text-sm font-bold text-slate-700">{label}{children}</label>; }
function Empty({ text }) { return <div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm"><Package className="mx-auto mb-3" size={36} /><p>{text}</p></div>; }
