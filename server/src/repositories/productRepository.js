import { pool } from "#infrastructure/db.js";

// Each function takes an executor as its last argument: pass a pg client to
// enlist the query in an open transaction, or omit it to run on the pool.
// Functions that only make sense inside a transaction require the client.

export async function findCategories(executor = pool) {
  const { rows } = await executor.query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category"
  );
  return rows.map((r) => r.category);
}

export async function findAll({ category } = {}, executor = pool) {
  const conditions = [];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await executor.query(
    `SELECT id, slug, name, price_cents, image_url, stock, category
     FROM products ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

export async function findBySlug(slug, executor = pool) {
  const { rows } = await executor.query(
    `SELECT id, slug, name, description, price_cents, image_url, stock, category
     FROM products WHERE slug = $1`,
    [slug]
  );
  return rows[0] ?? null;
}

// Used to re-price a cart the client is holding in localStorage.
export async function findByIds(ids, executor = pool) {
  const { rows } = await executor.query(
    "SELECT id, slug, name, price_cents, image_url, stock FROM products WHERE id = ANY($1)",
    [ids]
  );
  return rows;
}

// FOR UPDATE locks these rows for the caller's transaction: a concurrent
// checkout for the same products blocks until that transaction commits or rolls
// back, so two buyers cannot both reserve the last unit.
// Transaction-only — the client is required, not defaulted.
export async function findByIdsForUpdate(ids, client) {
  const { rows } = await client.query(
    "SELECT id, name, price_cents, stock FROM products WHERE id = ANY($1) FOR UPDATE",
    [ids]
  );
  return rows;
}
