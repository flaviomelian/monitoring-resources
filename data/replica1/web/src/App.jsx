import React, { useEffect, useState } from "react";

const API = "/api/items";
const empty = { name: "", description: "" };

export default function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error();
      setItems(await res.json());
      setError("");
    } catch {
      setError("No se pudo cargar la lista");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await fetch(editingId ? `${API}/${editingId}` : API, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return setError("No se pudo guardar");
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description || "" });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(empty);
  };

  const remove = async (id) => {
    if (!confirm("¿Borrar este elemento?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    if (editingId === id) cancel();
    load();
  };

  return (
    <div style={{ maxWidth: 560, margin: "2rem auto", fontFamily: "system-ui, sans-serif", padding: "0 1rem" }}>
      <h1>CRUD demo</h1>

      <form onSubmit={save} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <textarea
          placeholder="Descripción"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">{editingId ? "Actualizar" : "Crear"}</button>
          {editingId && (
            <button type="button" onClick={cancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
        {items.map((it) => (
          <li key={it.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12 }}>
            <strong>{it.name}</strong>
            <p style={{ margin: "4px 0 8px" }}>{it.description}</p>
            <button onClick={() => edit(it)}>Editar</button>{" "}
            <button onClick={() => remove(it.id)}>Borrar</button>
          </li>
        ))}
        {items.length === 0 && !error && <li>No hay elementos todavía.</li>}
      </ul>
    </div>
  );
}
