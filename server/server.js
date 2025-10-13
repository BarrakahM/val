import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const dbPath = path.join(__dirname, "data", "db.json");
function loadDB() {
  if (!fs.existsSync(dbPath)) {
    const seed = {
      products: [
        {
          id: "p1",
          name: "黄金修护精华",
          cat: "护肤",
          price: 399,
          stock: 88,
          status: "上架",
          img: "https://aidev.gemcoder.com/staticResource/echoAiSystemImages/c786c96cb2ac3d6d361425d4d17e911e.png"
        },
        {
          id: "p2",
          name: "彩妆盘",
          cat: "彩妆",
          price: 129,
          stock: 45,
          status: "上架",
          img: "https://aidev.gemcoder.com/staticResource/echoAiSystemImages/4419c2c08aa66a879c4d326721ba59ee.png"
        }
      ],
      categories: [
        { id: "c1", name: "护肤", sort: 1 },
        { id: "c2", name: "彩妆", sort: 2 }
      ],
      orders: [
        {
          id: "o1",
          no: "202510130001",
          user: "小美",
          amount: 588,
          status: "待发货",
          time: "2025-10-13 10:02"
        }
      ],
      users: [
        { id: "u1", name: "张三", phone: "138****8888", status: "待审核" },
        { id: "u2", name: "李四", level: "金卡", status: "正常" }
      ],
      points: [
        { id: "pt1", user: "王五", delta: 100, reason: "小票奖励", time: "2025-10-11" }
      ],
      receipts: [
        { id: "r1", user: "小美", img: "", amount: 188, status: "待审核" }
      ],
      questions: [
        { id: "q1", title: "T区情况", options: ["油", "干", "正常"] }
      ],
      aftersales: [
        { id: "as1", no: "AS20251013001", type: "退货", reason: "尺寸不合适", state: "待审核" }
      ],
      logistics: [
        { id: "l1", no: "202510130001", company: "顺丰", code: "SF123456", state: "运输中" }
      ]
    };
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Auth (mock)
app.post("/api/admin/login", (req, res) => {
  const { username, password, ip, loginAt } = req.body || {};
  if (username === "admin" && password === "admin123") {
    return res.json({ ok: true, user: { username }, ip, loginAt });
  }
  res.status(401).json({ ok: false, message: "invalid credentials" });
});

// Products
app.get("/api/products", (req, res) => {
  const db = loadDB();
  res.json(db.products);
});
app.post("/api/products", (req, res) => {
  const db = loadDB();
  const p = { id: nanoid(), stock: 0, status: "上架", ...req.body };
  db.products.push(p);
  saveDB(db);
  res.json(p);
});
app.put("/api/products/:id", (req, res) => {
  const db = loadDB();
  const i = db.products.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  db.products[i] = { ...db.products[i], ...req.body };
  saveDB(db);
  res.json(db.products[i]);
});
app.delete("/api/products/:id", (req, res) => {
  const db = loadDB();
  const i = db.products.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  const [d] = db.products.splice(i, 1);
  saveDB(db);
  res.json(d);
});

// Categories
app.get("/api/categories", (req, res) => {
  const db = loadDB();
  res.json(db.categories.sort((a, b) => a.sort - b.sort));
});
app.post("/api/categories", (req, res) => {
  const db = loadDB();
  const c = { id: nanoid(), sort: db.categories.length + 1, ...req.body };
  db.categories.push(c);
  saveDB(db);
  res.json(c);
});
app.put("/api/categories/:id", (req, res) => {
  const db = loadDB();
  const i = db.categories.findIndex((c) => c.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  db.categories[i] = { ...db.categories[i], ...req.body };
  saveDB(db);
  res.json(db.categories[i]);
});

// Orders
app.get("/api/orders", (req, res) => {
  const db = loadDB();
  res.json(db.orders);
});
app.put("/api/orders/:id", (req, res) => {
  const db = loadDB();
  const i = db.orders.findIndex((o) => o.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  db.orders[i] = { ...db.orders[i], ...req.body };
  saveDB(db);
  res.json(db.orders[i]);
});

// Users & audit & members
app.get("/api/users/audit", (req, res) => {
  const db = loadDB();
  res.json(db.users.filter((u) => u.status === "待审核"));
});
app.post("/api/users/audit/:id/approve", (req, res) => {
  const db = loadDB();
  const u = db.users.find((u) => u.id === req.params.id);
  if (!u) return res.sendStatus(404);
  u.status = "正常";
  saveDB(db);
  res.json(u);
});
app.post("/api/users/audit/:id/reject", (req, res) => {
  const db = loadDB();
  const u = db.users.find((u) => u.id === req.params.id);
  if (!u) return res.sendStatus(404);
  u.status = "拒绝";
  saveDB(db);
  res.json(u);
});
app.get("/api/users/members", (req, res) => {
  const db = loadDB();
  res.json(db.users.filter((u) => u.status !== "待审核"));
});
app.put("/api/users/:id", (req, res) => {
  const db = loadDB();
  const i = db.users.findIndex((u) => u.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  db.users[i] = { ...db.users[i], ...req.body };
  saveDB(db);
  res.json(db.users[i]);
});

// Points
app.get("/api/points", (req, res) => {
  const db = loadDB();
  res.json(db.points);
});
app.post("/api/points", (req, res) => {
  const db = loadDB();
  const p = { id: nanoid(), ...req.body };
  db.points.push(p);
  saveDB(db);
  res.json(p);
});

// Receipts
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });
app.get("/api/receipts", (req, res) => {
  const db = loadDB();
  res.json(db.receipts);
});
app.post("/api/receipts", upload.single("file"), (req, res) => {
  const db = loadDB();
  const r = {
    id: nanoid(),
    user: req.body.user || "匿名",
    img: req.file ? `/uploads/${req.file.filename}` : "",
    amount: Number(req.body.amount || 0),
    status: "待审核"
  };
  db.receipts.push(r);
  saveDB(db);
  res.json(r);
});
app.post("/api/receipts/:id/approve", (req, res) => {
  const db = loadDB();
  const r = db.receipts.find((r) => r.id === req.params.id);
  if (!r) return res.sendStatus(404);
  r.status = "已通过";
  db.points.push({
    id: nanoid(),
    user: r.user,
    delta: Math.round(r.amount),
    reason: "小票奖励",
    time: new Date().toISOString().slice(0, 10)
  });
  saveDB(db);
  res.json(r);
});
app.post("/api/receipts/:id/reject", (req, res) => {
  const db = loadDB();
  const r = db.receipts.find((r) => r.id === req.params.id);
  if (!r) return res.sendStatus(404);
  r.status = "已拒绝";
  saveDB(db);
  res.json(r);
});

// Logistics
app.get("/api/logistics", (req, res) => {
  const db = loadDB();
  res.json(db.logistics);
});
app.post("/api/logistics", (req, res) => {
  const db = loadDB();
  const l = { id: nanoid(), ...req.body };
  db.logistics.push(l);
  saveDB(db);
  res.json(l);
});

// Aftersales
app.get("/api/aftersales", (req, res) => {
  const db = loadDB();
  res.json(db.aftersales);
});
app.post("/api/aftersales", (req, res) => {
  const db = loadDB();
  const a = { id: nanoid(), ...req.body };
  db.aftersales.push(a);
  saveDB(db);
  res.json(a);
});

// Skin test questions
app.get("/api/questions", (req, res) => {
  const db = loadDB();
  res.json(db.questions);
});
app.post("/api/questions", (req, res) => {
  const db = loadDB();
  const q = { id: nanoid(), ...req.body };
  db.questions.push(q);
  saveDB(db);
  res.json(q);
});
app.put("/api/questions/:id", (req, res) => {
  const db = loadDB();
  const i = db.questions.findIndex((q) => q.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  db.questions[i] = { ...db.questions[i], ...req.body };
  saveDB(db);
  res.json(db.questions[i]);
});
app.delete("/api/questions/:id", (req, res) => {
  const db = loadDB();
  const i = db.questions.findIndex((q) => q.id === req.params.id);
  if (i < 0) return res.sendStatus(404);
  const [d] = db.questions.splice(i, 1);
  saveDB(db);
  res.json(d);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
