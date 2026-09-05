import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { initDB } from './src/config/db.js';
import productRoutes from './src/routes/products.js';
import supplierRoutes from './src/routes/suppliers.js';
import alertRoutes from './src/routes/alerts.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Some browsers (Chrome's "Private Network Access" policy) block a page
// opened directly from disk (file://) from calling a server on localhost
// unless the server explicitly opts in via this header on preflight
// requests. This makes the API reachable from a double-clicked HTML file,
// not just from a page served over http://.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/alerts', alertRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Inventory Management API listening on http://localhost:${PORT}`);
  });
});