import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export interface ImportedDataRecord {
  id: string;
  filename: string;
  type: 'csv' | 'xlsx' | 'sql';
  uploadDate: string;
  recordCount: number;
  columns: string[];
  mappedFields: Record<string, string>;
  status: 'processing' | 'mapped' | 'imported' | 'error';
  data?: any[];
}

export interface CalculationFormula {
  id: string;
  framework: string;
  type: string;
  formula: string;
  variables: Record<string, number>;
  description: string;
}

// In-memory storage for demonstration
const importedData: Map<string, ImportedDataRecord> = new Map();
const calculationFormulas: CalculationFormula[] = [
  {
    id: 'fueleu-intensity',
    framework: 'FuelEU Maritime',
    type: 'GHG Intensity Calculation',
    formula: '(fuelConsumption * emissionFactor * lcv) / (distance * capacity)',
    variables: {
      emissionFactor: 3.206,
      lcv: 40.2,
      capacity: 1000,
      distance: 1
    },
    description: 'Calculate GHG intensity for FuelEU Maritime compliance'
  },
  {
    id: 'eu-ets-cost',
    framework: 'EU ETS',
    type: 'Allowance Cost Calculation',
    formula: 'fuelConsumption * emissionFactor * coverage * euaPrice',
    variables: {
      emissionFactor: 3.206,
      coverage: 0.7,
      euaPrice: 85
    },
    description: 'Calculate EU ETS allowance costs for maritime operations'
  },
  {
    id: 'imo-reduction',
    framework: 'IMO Net Zero',
    type: 'Emission Reduction Calculation',
    formula: '((baseline - current) / baseline) * 100',
    variables: {
      baseline: 91.16,
      current: 85.0
    },
    description: 'Calculate percentage reduction from IMO baseline'
  },
  {
    id: 'uk-ets-cost',
    framework: 'UK ETS',
    type: 'UK Allowance Cost Calculation',
    formula: 'fuelConsumption * emissionFactor * ukCoverage * ukAllowancePrice * gbpToEur',
    variables: {
      emissionFactor: 3.206,
      ukCoverage: 0.25,
      ukAllowancePrice: 75,
      gbpToEur: 1.17
    },
    description: 'Calculate UK ETS allowance costs for UK port operations'
  }
];

export class DataImportService {
  
  async processCSVFile(buffer: Buffer, filename: string): Promise<ImportedDataRecord> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const columns: string[] = [];
      let isFirstRow = true;

      const readable = Readable.from(buffer);
      readable
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          columns.push(...headers);
        })
        .on('data', (data: any) => {
          if (isFirstRow) {
            // Map common maritime data fields
            const mappedFields = this.mapMaritimeFields(Object.keys(data));
            isFirstRow = false;
          }
          records.push(data);
        })
        .on('end', () => {
          const importRecord: ImportedDataRecord = {
            id: Date.now().toString(),
            filename,
            type: 'csv',
            uploadDate: new Date().toISOString(),
            recordCount: records.length,
            columns,
            mappedFields: this.mapMaritimeFields(columns),
            status: 'imported',
            data: records
          };
          
          importedData.set(importRecord.id, importRecord);
          resolve(importRecord);
        })
        .on('error', reject);
    });
  }

  async processXLSXFile(buffer: Buffer, filename: string): Promise<ImportedDataRecord> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];

      const importRecord: ImportedDataRecord = {
        id: Date.now().toString(),
        filename,
        type: 'xlsx',
        uploadDate: new Date().toISOString(),
        recordCount: jsonData.length,
        columns,
        mappedFields: this.mapMaritimeFields(columns),
        status: 'imported',
        data: jsonData
      };

      importedData.set(importRecord.id, importRecord);
      return importRecord;
    } catch (error) {
      throw new Error(`Failed to process XLSX file: ${error}`);
    }
  }

  async processSQLFile(buffer: Buffer, filename: string): Promise<ImportedDataRecord> {
    try {
      const sqlContent = buffer.toString('utf-8');
      
      // Basic SQL parsing for demonstration
      const lines = sqlContent.split('\n').filter(line => line.trim());
      const tableMatches = sqlContent.match(/CREATE TABLE\s+(\w+)/gi) || [];
      const tables = tableMatches.map(match => match.replace(/CREATE TABLE\s+/i, ''));
      
      const importRecord: ImportedDataRecord = {
        id: Date.now().toString(),
        filename,
        type: 'sql',
        uploadDate: new Date().toISOString(),
        recordCount: lines.length,
        columns: tables,
        mappedFields: {},
        status: 'mapped',
        data: [{ sqlContent, tables }]
      };

      importedData.set(importRecord.id, importRecord);
      return importRecord;
    } catch (error) {
      throw new Error(`Failed to process SQL file: ${error}`);
    }
  }

  private mapMaritimeFields(columns: string[]): Record<string, string> {
    const mappings: Record<string, string> = {};
    const fieldMappings = {
      // Vessel identification
      'imo': ['imo', 'imo_number', 'imo_no', 'vessel_imo'],
      'vessel_name': ['vessel_name', 'ship_name', 'name', 'vessel'],
      'mmsi': ['mmsi', 'mmsi_number'],
      'call_sign': ['call_sign', 'callsign', 'call_signal'],
      
      // Vessel specifications
      'gross_tonnage': ['gross_tonnage', 'gt', 'gross_tons', 'tonnage'],
      'deadweight': ['deadweight', 'dwt', 'dead_weight'],
      'vessel_type': ['vessel_type', 'ship_type', 'type'],
      'flag': ['flag', 'flag_state', 'flag_country'],
      
      // Fuel consumption
      'fuel_consumption': ['fuel_consumption', 'fuel_used', 'consumption', 'fuel_qty'],
      'fuel_type': ['fuel_type', 'fuel', 'fuel_grade'],
      'ghg_intensity': ['ghg_intensity', 'co2_intensity', 'emission_intensity'],
      
      // Voyage data
      'departure_port': ['departure_port', 'from_port', 'origin'],
      'arrival_port': ['arrival_port', 'to_port', 'destination'],
      'voyage_date': ['voyage_date', 'date', 'departure_date'],
      'distance': ['distance', 'voyage_distance', 'nautical_miles'],
      
      // Compliance data
      'compliance_status': ['compliance_status', 'status', 'compliant'],
      'penalty_amount': ['penalty_amount', 'penalty', 'fine'],
      'credits_used': ['credits_used', 'credits', 'credit_balance']
    };

    columns.forEach(column => {
      const lowerColumn = column.toLowerCase();
      for (const [standardField, variations] of Object.entries(fieldMappings)) {
        if (variations.some(variation => lowerColumn.includes(variation))) {
          mappings[column] = standardField;
          break;
        }
      }
    });

    return mappings;
  }

  getImportedFiles(): ImportedDataRecord[] {
    return Array.from(importedData.values());
  }

  getCalculationFormulas(): CalculationFormula[] {
    return calculationFormulas;
  }

  updateCalculationFormula(id: string, formula: Partial<CalculationFormula>): CalculationFormula {
    const index = calculationFormulas.findIndex(f => f.id === id);
    if (index === -1) {
      throw new Error('Formula not found');
    }
    
    calculationFormulas[index] = { ...calculationFormulas[index], ...formula };
    return calculationFormulas[index];
  }

  async exportData(format: 'csv' | 'xlsx' | 'sql', dataType: string): Promise<Buffer> {
    // Generate sample data based on dataType
    const sampleData = this.generateSampleData(dataType);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(sampleData);
      case 'xlsx':
        return this.exportToXLSX(sampleData);
      case 'sql':
        return this.exportToSQL(sampleData, dataType);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private generateSampleData(dataType: string): any[] {
    switch (dataType) {
      case 'vessel-data':
        return [
          {
            imo: '9123456',
            vessel_name: 'MV Atlantic Star',
            gross_tonnage: 50000,
            vessel_type: 'Container Ship',
            flag: 'Marshall Islands'
          },
          {
            imo: '9234567',
            vessel_name: 'MV Pacific Dawn',
            gross_tonnage: 75000,
            vessel_type: 'Bulk Carrier',
            flag: 'Panama'
          }
        ];
      case 'fuel-consumption':
        return [
          {
            imo: '9123456',
            voyage_date: '2024-01-15',
            fuel_consumption: 125.5,
            fuel_type: 'VLSFO',
            distance: 2500
          },
          {
            imo: '9234567',
            voyage_date: '2024-01-20',
            fuel_consumption: 180.2,
            fuel_type: 'MGO',
            distance: 3200
          }
        ];
      default:
        return [{ message: `Sample ${dataType} data` }];
    }
  }

  private exportToCSV(data: any[]): Buffer {
    if (data.length === 0) return Buffer.from('');
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');
    
    return Buffer.from(csvContent, 'utf-8');
  }

  private exportToXLSX(data: any[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maritime Data');
    
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private exportToSQL(data: any[], tableName: string): Buffer {
    if (data.length === 0) return Buffer.from('');
    
    const headers = Object.keys(data[0]);
    const createTableSQL = `CREATE TABLE ${tableName} (\n${
      headers.map(header => `  ${header} VARCHAR(255)`).join(',\n')
    }\n);\n\n`;
    
    const insertSQL = data.map(row => {
      const values = headers.map(header => 
        typeof row[header] === 'string' ? `'${row[header].replace(/'/g, "''")}'` : row[header]
      ).join(', ');
      return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values});`;
    }).join('\n');
    
    return Buffer.from(createTableSQL + insertSQL, 'utf-8');
  }
}

export const dataImportService = new DataImportService();