# SmartBudget — Architecture Deep Dive

<a href="#arquitectura-detallada">🇲🇽 Español</a> &nbsp;·&nbsp; <a href="#detailed-architecture">🇺🇸 English</a>

---

<a id="arquitectura-detallada"></a>

## 🇲🇽 Arquitectura Detallada

Este documento describe las decisiones de diseño internas del proyecto para devs que quieran entender o extender el código.

---

### Modelo de datos

#### `User`

```js
{
  _id:      ObjectId,
  name:     String,          // nombre de display
  email:    String,          // unique, lowercase
  password: String,          // bcrypt hash (rounds=10)
  createdAt: Date
}
```

#### `Transaction`

```js
{
  _id:         ObjectId,
  user:        ObjectId,     // ref → User (siempre incluido en queries)
  description: String,
  amount:      Number,       // siempre positivo
  type:        'income' | 'expense',
  category:    String,       // slug ('food', 'salary', etc.)
  date:        Date,
  createdAt:   Date
}
```

Las categorías válidas se definen en `aiService.js` y en `frontend/src/utils/categories.js`. Ambas listas deben estar sincronizadas.

#### `UserSettings`

```js
{
  _id:             ObjectId,
  user:            ObjectId,     // 1-to-1 con User
  encryptedApiKey: String,       // AES-256-GCM ciphertext (hex)
  apiKeyIv:        String,       // IV único por cifrado (hex)
  apiKeyAuthTag:   String,       // GCM auth tag (hex)
  apiKeyLastFour:  String,       // últimos 4 chars en texto plano (para UI)
  hasCustomKey:    Boolean,      // flag de conveniencia
}
```

---

### Flujo de autenticación JWT

```
Cliente                          Backend
  │                                │
  │── POST /api/auth/register ────►│
  │   { name, email, password }    │ bcrypt.hash(password, 10)
  │                                │ User.create(...)
  │◄── { token, user } ───────────│ jwt.sign({ id }, JWT_SECRET, '7d')
  │                                │
  │  localStorage.setItem('token') │
  │                                │
  │── GET /api/transactions ──────►│
  │   Authorization: Bearer <token>│ jwt.verify(token, JWT_SECRET)
  │                                │ req.user = { _id, ... }
  │◄── [ ...transactions ] ───────│ Transaction.find({ user: req.user._id })
  │                                │
  │── (token expira o inválido) ──►│
  │◄── 401 Unauthorized ──────────│
  │                                │
  │  interceptor axios detecta 401 │
  │  localStorage.removeItem(...)  │
  │  window.location = '/login'    │
```

El interceptor en `frontend/src/services/api.js` maneja el 401 globalmente **excepto** en los endpoints `/api/auth/login` y `/api/auth/register`, donde un 401 es una respuesta esperada ("credenciales incorrectas").

---

### Cómo funciona BYOK end-to-end

**BYOK = Bring Your Own Key.** El usuario aporta su propia API key de Anthropic para no compartir cuota con otros usuarios del servidor.

#### Flujo de guardado

```
Frontend                         Backend                    Anthropic
   │                                │                           │
   │── POST /api/settings/api-key ─►│                           │
   │   { apiKey: "sk-ant-..." }     │                           │
   │                                │── messages.create(test) ─►│
   │                                │◄── { content: [...] } ────│
   │                                │                           │
   │                                │ encrypt(apiKey, ENCRYPTION_SECRET)
   │                                │ → { iv, ciphertext, authTag }
   │                                │                           │
   │                                │ UserSettings.findOneAndUpdate(
   │                                │   { user: req.user._id },
   │                                │   { encryptedApiKey, iv, authTag,
   │                                │     apiKeyLastFour, hasCustomKey: true }
   │                                │ )
   │◄── { hasCustomKey: true } ─────│
```

#### Flujo de uso en categorización

```
POST /api/transactions
  │
  ├─ getUserApiKey(user._id)
  │    ├─ UserSettings.findOne({ user })
  │    ├─ decrypt(encryptedApiKey, ENCRYPTION_SECRET, iv, authTag)
  │    └─ return plaintext key (solo en memoria, nunca se persiste descifrado)
  │
  ├─ new Anthropic({ apiKey: userKey ?? serverKey })
  │
  └─ client.messages.create(...)
```

La función `decrypt` en `encryptionService.js` usa `crypto.createDecipheriv('aes-256-gcm', key, iv)` con verificación del auth tag. Si el tag no coincide (datos manipulados), lanza un error.

#### Rate limiting diferenciado

```js
// aiRateLimiter.js (mismo patrón en reportRoutes.js)
const conditionalLimiter = async (req, res, next) => {
  const settings = await UserSettings.findOne({ user: req.user._id });
  if (settings?.hasCustomKey) return next();       // BYOK: sin límite del servidor
  return standardRateLimiter(req, res, next);      // Demo: 5 req / 5 min
};
```

---

### Prompt engineering

#### Categorización de transacciones

**Técnica: Output Space Constraining**

El prompt lista explícitamente las categorías permitidas para el tipo de transacción. Claude no puede inventar categorías nuevas porque el espacio de salida está restringido por instrucción explícita.

```
System: "You must respond with exactly ONE word from the allowed categories list."

User: "Transaction: 'Netflix subscription'
       Type: expense
       Allowed: food, transport, entertainment, utilities, health, shopping, education, other
       Respond with only the category name in lowercase."
```

El backend valida la respuesta contra `VALID_CATEGORIES`. Si Claude devuelve algo inesperado (a pesar del constraining), se aplica un fallback a `'other'` o `'other_income'`.

**Configuración:** `max_tokens: 20` — suficiente para una sola palabra, reduce costo y latencia.

#### Reporte mensual

**Técnica: Structured Output with Section Headers**

El prompt especifica exactamente las secciones y su longitud aproximada:

```
"Generate a monthly report with exactly these sections:
## Executive Summary (2-3 lines)
## Patterns I Detected (3-5 bullets)
## Recommendations (3 actionable bullets)
## Motivational Note (1 encouraging line)"
```

Los stats se calculan en el servidor (`calcStats` en `reportService.js`) y se inyectan como texto estructurado. Claude **no** accede a la base de datos ni hace cálculos; solo interpreta números ya calculados.

**Beneficios:**
- Reduce tokens de prompt (no se envían transacciones raw en exceso, máx 50)
- Claude puede enfocarse en interpretación, no en aritmética
- El reporte es reproducible: mismos stats = mismo formato de reporte

---

### Decisiones de seguridad

| Área | Implementación | Por qué |
|---|---|---|
| **Passwords** | bcrypt, cost factor 10 | Resistente a brute-force; factor 10 = ~100ms hash |
| **API keys BYOK** | AES-256-GCM | Cifrado autenticado; detecta tampering del ciphertext |
| **IV único** | `crypto.randomBytes(12)` por cifrado | Previene reutilización de IV que rompería GCM |
| **JWT expiry** | 7 días | Balance entre UX y seguridad |
| **CORS en prod** | Solo `FRONTEND_URL` | Rechaza requests de orígenes no autorizados |
| **Helmet** | Headers HTTP seguros | X-Frame-Options, Content-Security-Policy, etc. |
| **Multi-tenant** | `{ user: req.user._id }` en todas las queries | Imposible acceder a datos de otro usuario |
| **Rate limiting** | express-rate-limit por user._id | Protege contra abuso de la API de Anthropic |

---

### Estructura de carpetas

```
SmartBudget/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexión a MongoDB
│   │   ├── controllers/     # Lógica de negocio por dominio
│   │   │   ├── authController.js
│   │   │   ├── transactionController.js
│   │   │   ├── settingsController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT verify + req.user
│   │   ├── models/          # Schemas de Mongoose
│   │   ├── routes/          # Express routers
│   │   ├── services/
│   │   │   ├── aiService.js         # Categorización con Claude
│   │   │   ├── reportService.js     # Reportes mensuales
│   │   │   └── encryptionService.js # AES-256-GCM
│   │   └── utils/
│   │       └── getUserApiKey.js     # Descifra API key del usuario
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components reutilizables
│   │   │   ├── charts/      # Recharts wrappers
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── TransactionList.jsx
│   │   │   ├── MonthlyReport.jsx
│   │   │   └── ...
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── hooks/           # useTransactions, useSettings, useConfirm
│   │   ├── i18n/            # Configuración react-i18next
│   │   ├── locales/         # es/translation.json, en/translation.json
│   │   ├── pages/           # Home, Login, Register, Dashboard, Settings
│   │   ├── services/        # api.js (axios), reportService.js
│   │   └── utils/           # analytics.js, categories.js, formatters.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── img/
│       ├── es/    # Screenshots en español
│       └── en/    # Screenshots en inglés
│
├── README.md
├── LICENSE
└── docs/ARCHITECTURE.md   ← este archivo
```

---

---

<a id="detailed-architecture"></a>

## 🇺🇸 Detailed Architecture

This document describes the internal design decisions for developers who want to understand or extend the codebase.

---

### Data models

#### `User`

```js
{
  _id:       ObjectId,
  name:      String,        // display name
  email:     String,        // unique, lowercase
  password:  String,        // bcrypt hash (rounds=10)
  createdAt: Date
}
```

#### `Transaction`

```js
{
  _id:         ObjectId,
  user:        ObjectId,    // ref → User (always included in queries)
  description: String,
  amount:      Number,      // always positive
  type:        'income' | 'expense',
  category:    String,      // slug ('food', 'salary', etc.)
  date:        Date,
  createdAt:   Date
}
```

Valid categories are defined in `aiService.js` and `frontend/src/utils/categories.js`. Both lists must stay in sync.

#### `UserSettings`

```js
{
  _id:             ObjectId,
  user:            ObjectId,    // 1-to-1 with User
  encryptedApiKey: String,      // AES-256-GCM ciphertext (hex)
  apiKeyIv:        String,      // unique IV per encryption (hex)
  apiKeyAuthTag:   String,      // GCM auth tag (hex)
  apiKeyLastFour:  String,      // last 4 chars in plain text (for UI)
  hasCustomKey:    Boolean,     // convenience flag
}
```

---

### JWT authentication flow

```
Client                           Backend
  │                                │
  │── POST /api/auth/register ────►│
  │   { name, email, password }    │ bcrypt.hash(password, 10)
  │                                │ User.create(...)
  │◄── { token, user } ───────────│ jwt.sign({ id }, JWT_SECRET, '7d')
  │                                │
  │  localStorage.setItem('token') │
  │                                │
  │── GET /api/transactions ──────►│
  │   Authorization: Bearer <tok>  │ jwt.verify(token, JWT_SECRET)
  │                                │ req.user = { _id, ... }
  │◄── [ ...transactions ] ───────│ Transaction.find({ user: req.user._id })
  │                                │
  │── (token expired or invalid) ─►│
  │◄── 401 Unauthorized ──────────│
  │                                │
  │  axios interceptor catches 401 │
  │  localStorage.removeItem(...)  │
  │  window.location = '/login'    │
```

The interceptor in `frontend/src/services/api.js` handles 401 globally **except** on `/api/auth/login` and `/api/auth/register` endpoints, where a 401 is an expected response ("wrong credentials").

---

### BYOK end-to-end flow

**Save flow:**

```
Frontend                         Backend                    Anthropic
   │                                │                           │
   │── POST /api/settings/api-key ─►│                           │
   │   { apiKey: "sk-ant-..." }     │── messages.create(test) ─►│
   │                                │◄── { content: [...] } ────│
   │                                │                           │
   │                                │ encrypt(apiKey, ENCRYPTION_SECRET)
   │                                │ → { iv, ciphertext, authTag }
   │                                │                           │
   │                                │ UserSettings.findOneAndUpdate({ user })
   │◄── { hasCustomKey: true } ─────│
```

**Usage flow:**

```
POST /api/transactions
  ├─ getUserApiKey(user._id)
  │    ├─ UserSettings.findOne({ user })
  │    └─ decrypt(encryptedApiKey, ...) → plain key (in memory only)
  │
  ├─ new Anthropic({ apiKey: userKey ?? serverKey })
  └─ client.messages.create(...)
```

---

### Prompt engineering

**Categorization — Output Space Constraining:**

Explicitly listing the allowed categories in the prompt prevents Claude from generating values outside the valid set. Even if the model hallucinates, the backend validates the response against `VALID_CATEGORIES` and applies a safe fallback.

**Monthly reports — Structured Output with Section Headers:**

Stats are computed server-side (`calcStats`) and injected as structured text. Claude receives pre-calculated numbers (sums, averages, top categories) and only needs to interpret them — not compute them. This reduces token usage and improves report consistency.

---

### Security decisions

| Area | Implementation | Why |
|---|---|---|
| **Passwords** | bcrypt, cost factor 10 | Brute-force resistant; factor 10 ≈ 100ms per hash |
| **BYOK API keys** | AES-256-GCM | Authenticated encryption; detects ciphertext tampering |
| **Unique IV** | `crypto.randomBytes(12)` per encryption | Prevents IV reuse which would break GCM security |
| **JWT expiry** | 7 days | Balance between UX and security |
| **CORS in prod** | Only `FRONTEND_URL` | Rejects requests from unauthorized origins |
| **Helmet** | Secure HTTP headers | X-Frame-Options, CSP, etc. |
| **Multi-tenant** | `{ user: req.user._id }` in all queries | Impossible to access another user's data |
| **Rate limiting** | express-rate-limit keyed by user._id | Protects against Anthropic API abuse |
