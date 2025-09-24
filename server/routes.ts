import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { dataImportService } from "./dataImportService";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Data import routes
  app.post('/api/data-imports/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, buffer, mimetype } = req.file;
      let result;

      if (mimetype === 'text/csv' || originalname.endsWith('.csv')) {
        result = await dataImportService.processCSVFile(buffer, originalname);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || originalname.endsWith('.xlsx')) {
        result = await dataImportService.processXLSXFile(buffer, originalname);
      } else if (originalname.endsWith('.sql')) {
        result = await dataImportService.processSQLFile(buffer, originalname);
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      res.json(result);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });

  app.get('/api/data-imports', (req, res) => {
    try {
      const files = dataImportService.getImportedFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching imported files:', error);
      res.status(500).json({ error: 'Failed to fetch imported files' });
    }
  });

  app.get('/api/calculation-formulas', (req, res) => {
    try {
      const formulas = dataImportService.getCalculationFormulas();
      res.json(formulas);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      res.status(500).json({ error: 'Failed to fetch formulas' });
    }
  });

  app.put('/api/calculation-formulas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const formula = req.body;
      const updated = dataImportService.updateCalculationFormula(id, formula);
      res.json(updated);
    } catch (error) {
      console.error('Error updating formula:', error);
      res.status(500).json({ error: 'Failed to update formula' });
    }
  });

  app.get('/api/data-exports/:format', async (req, res) => {
    try {
      const { format } = req.params;
      const { type } = req.query;
      
      if (!['csv', 'xlsx', 'sql'].includes(format)) {
        return res.status(400).json({ error: 'Invalid export format' });
      }

      const data = await dataImportService.exportData(format as 'csv' | 'xlsx' | 'sql', type as string);
      
      // Set appropriate headers
      const contentTypes = {
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sql: 'application/sql'
      };

      res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
      res.setHeader('Content-Disposition', `attachment; filename="maritime-${type}.${format}"`);
      res.send(data);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
