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
  variables: Record<string, number | string>;
  description: string;
  locked?: boolean;
}

// In-memory storage for demonstration
const importedData: Map<string, ImportedDataRecord> = new Map();
const calculationFormulas: CalculationFormula[] = [
  // FuelEU Maritime Formulas - Comprehensive Set from ESSF SAPS Document
  {
    id: 'fueleu-ghg-intensity',
    framework: 'FuelEU Maritime',
    type: 'GHG Intensity Calculation (Primary)',
    formula: 'GHG_Intensity = f_wind × (WtT + TtW)',
    variables: {
      f_wind: 1.0,
      reference_value: 91.16,
      target_2025: 89.34,
      penalty_rate: 2400,
      GWP_CO2: 1,
      GWP_CH4: 25,
      GWP_N2O: 298
    },
    description: 'Primary FuelEU GHG intensity calculation with wind-assisted propulsion factor',
    locked: false
  },
  {
    id: 'fueleu-wtt',
    framework: 'FuelEU Maritime', 
    type: 'Well-to-Tank (WtT) Calculation',
    formula: 'WtT = Σ(M_i × CO2eq_WtT,i × LCV_i) / Σ(M_i × LCV_i × RWD_i + E_k)',
    variables: {
      HFO_WtT: 13.5,
      LFO_WtT: 13.2,
      MDO_WtT: 14.4,
      LNG_WtT: 18.5,
      RFNBO_reward: 2.0,
      HFO_LCV: 0.0405,
      LFO_LCV: 0.0410,
      MDO_LCV: 0.0427,
      LNG_LCV: 0.0491
    },
    description: 'Well-to-tank emissions calculation for all fuel types per ESSF guidelines',
    locked: false
  },
  {
    id: 'fueleu-ttw',
    framework: 'FuelEU Maritime',
    type: 'Tank-to-Wake (TtW) Calculation', 
    formula: 'TtW = Σ(M_i,j × [(1-C_slip_j/100) × CO2eq_TtW,i,j + (C_slip_j/100) × CO2eq_TtW,slip,i,j])',
    variables: {
      HFO_CO2: 3.114,
      LFO_CO2: 3.151,
      MDO_CO2: 3.206,
      LNG_CO2: 2.750,
      LNG_slip_medium: 3.1,
      LNG_slip_slow: 1.7,
      LNG_slip_diesel: 0.2,
      HFO_CH4: 0.00005,
      HFO_N2O: 0.00018,
      LNG_N2O: 0.00011
    },
    description: 'Tank-to-wake emissions including fuel slip calculations per Annex I',
    locked: false
  },
  {
    id: 'fueleu-compliance',
    framework: 'FuelEU Maritime',
    type: 'Compliance Balance Calculation',
    formula: 'Compliance_Balance = (GHG_Target - GHG_Actual) × Total_Energy_Used',
    variables: {
      target_2025: 89.34,
      target_2030: 85.89,
      target_2035: 77.93,
      target_2040: 62.90,
      target_2045: 34.64,
      target_2050: 18.23,
      baseline_2020: 91.16
    },
    description: 'Annual compliance balance assessment with progressive reduction targets',
    locked: true
  },
  {
    id: 'fueleu-penalty',
    framework: 'FuelEU Maritime',
    type: 'Financial Penalty Calculation',
    formula: 'Penalty = €58.50 × Non_Compliant_Energy_GJ + OPS_Penalty',
    variables: {
      penalty_per_GJ: 58.50,
      penalty_per_MT_VLSFO: 2400,
      OPS_penalty_rate: 1.5,
      escalation_factor: 1.1,
      consecutive_penalty: "10% increase per period"
    },
    description: 'Financial penalty calculation for non-compliance including OPS requirements',
    locked: true
  },
  {
    id: 'fueleu-rfnbo-incentive',
    framework: 'FuelEU Maritime',
    type: 'RFNBO Incentive Calculation',
    formula: 'RFNBO_Factor = 0.5 × Actual_GHG_Intensity (2025-2033)',
    variables: {
      incentive_factor: 0.5,
      start_date: "2025-01-01",
      end_date: "2033-12-31",
      applicable_fuels: "e-fuels, green hydrogen, green ammonia"
    },
    description: 'Renewable fuels of non-biological origin incentive calculation',
    locked: true
  },

  // EU ETS Formulas - Latest 2025 Implementation
  {
    id: 'eu-ets-emissions',
    framework: 'EU ETS',
    type: 'CO2 Emissions Calculation',
    formula: 'CO2_Emissions = Fuel_Consumption × CO2_Emission_Factor',
    variables: {
      HFO_factor: 3.114,
      VLSFO_factor: 3.151,
      LSMGO_factor: 3.206,
      coverage_2025: 70,
      coverage_2026: 100,
      reporting_start: "2024-01-01"
    },
    description: 'Basic CO2 emissions calculation for EU ETS compliance with latest factors',
    locked: false
  },
  {
    id: 'eu-ets-allowances',
    framework: 'EU ETS',
    type: 'ETS Allowance Calculation',
    formula: 'ETS_Allowances = CO2_Emissions × Coverage_Percentage × Phase_Rate',
    variables: {
      phase_2025: 70,
      phase_2026: 100,
      intra_EU_coverage: 100,
      extra_EU_coverage: 50,
      penalty_rate: 100,
      current_EUA_price: 118,
      surrender_deadline: "2025-09-30"
    },
    description: 'Required EU ETS allowances with 2025 phase-in schedule',
    locked: false
  },
  {
    id: 'eu-ets-voyage-coverage',
    framework: 'EU ETS',
    type: 'Voyage Coverage Rules',
    formula: 'Applicable_Emissions = CO2_Emissions × Coverage_Rate',
    variables: {
      intra_EU: 100,
      EU_to_third_country: 50,
      third_country_to_EU: 50,
      scope_threshold: 5000,
      CH4_inclusion: "2026-01-01",
      N2O_inclusion: "2026-01-01"
    },
    description: 'Voyage-specific coverage rates for different route types',
    locked: true
  },
  {
    id: 'eu-ets-ghg-expansion',
    framework: 'EU ETS',
    type: 'Multi-GHG Calculation (2026+)',
    formula: 'Total_Emissions = CO2 + (CH4 × 25) + (N2O × 298)',
    variables: {
      CH4_GWP: 25,
      N2O_GWP: 298,
      expansion_date: "2026-01-01",
      new_scope: "Ships ≥400 GT but <5000 GT"
    },
    description: 'Expanded GHG calculation including methane and nitrous oxide from 2026',
    locked: true
  },

  // IMO Net Zero Framework Formulas - 2025 Approved Framework
  {
    id: 'imo-gfi-attained',
    framework: 'IMO Net Zero Framework',
    type: 'Attained GHG Fuel Intensity (GFI)',
    formula: 'GFI_attained = Σ(GHG_WtW,j × E_j) / ΣE_j',
    variables: {
      baseline_2008: 93.3,
      reference_unit: "gCO2eq/MJ",
      ZNZ_threshold_2028: 19,
      ZNZ_threshold_2035: 14,
      scope_GT: 5000,
      adoption_date: "2025-10-01"
    },
    description: 'Primary IMO GFI calculation for global shipping compliance',
    locked: false
  },
  {
    id: 'imo-compliance-balance',
    framework: 'IMO Net Zero Framework',
    type: 'Compliance Balance Assessment',
    formula: 'Compliance_Balance = (Target_GFI - Attained_GFI) × Total_Energy',
    variables: {
      target_2028: 4,
      target_2030: 10,
      target_2035: 30,
      target_2040: 65,
      surplus_validity: 2,
      baseline_reduction: "percentage",
      entry_force: "2027-03-01"
    },
    description: 'Annual compliance assessment for surplus/deficit determination',
    locked: false
  },
  {
    id: 'imo-pricing-system',
    framework: 'IMO Net Zero Framework',
    type: 'Two-Tier Pricing System',
    formula: 'Remedial_Cost = Deficit_tCO2eq × Tier_Rate',
    variables: {
      tier1_base_rate: 100,
      tier2_enhanced_rate: 380,
      compliance_start: "2028-01-01",
      registry_opening: "2027-01-01",
      price_escalation: "annually reviewed"
    },
    description: 'IMO dual-tier penalty structure for non-compliance with net-zero targets',
    locked: true
  },
  {
    id: 'imo-surplus-management',
    framework: 'IMO Net Zero Framework',
    type: 'Surplus Unit (SU) Management',
    formula: 'Surplus_Units = Positive_Compliance_Balance / tCO2eq_Conversion',
    variables: {
      validity_period: 2,
      transfer_allowed: 1,
      max_transfer_price: 380,
      banking_allowed: 1,
      conversion_rate: 1
    },
    description: 'Management of compliance surplus units for trading and banking',
    locked: false
  },

  // UK ETS Formulas - Launching July 2026
  {
    id: 'uk-ets-emissions',
    framework: 'UK ETS',
    type: 'UK Maritime CO2 Calculation',
    formula: 'CO2_Emissions = Fuel_Consumption × UK_Emission_Factor',
    variables: {
      MGO_factor: 3.206,
      HFO_factor: 3.114,
      MDO_factor: 3.206,
      LNG_factor: 2.750,
      methanol_factor: 1.375,
      ammonia_factor: 0.000,
      start_date: "2026-07-01"
    },
    description: 'UK-specific CO2 emissions calculation for domestic voyages only',
    locked: false
  },
  {
    id: 'uk-ets-allowances',
    framework: 'UK ETS',
    type: 'UK Carbon Allowance Requirements',
    formula: 'UK_Allowances = CO2_Emissions × Coverage_Rate × GHG_Multiplier',
    variables: {
      domestic_coverage: 100,
      port_emissions: 100,
      current_price_low: 31,
      current_price_high: 100,
      reserve_price: 22,
      market_size_estimate: 2000000,
      first_surrender: "2027-04-30"
    },
    description: 'UK ETS allowance calculation for domestic shipping with no phase-in',
    locked: false
  },
  {
    id: 'uk-ets-ghg-expansion',
    framework: 'UK ETS',
    type: 'Multi-GHG Calculation (2026+)',
    formula: 'Total_GHG = CO2_Emissions + (CH4_Emissions × 25) + (N2O_Emissions × 298)',
    variables: {
      CH4_GWP: 25,
      N2O_GWP: 298,
      scope_threshold: 5000,
      reporting_deadline: "2027-03-31",
      surrender_deadline: "2027-04-30",
      exemption: "Government vessels excluded"
    },
    description: 'Extended GHG calculation including methane and nitrous oxide from launch',
    locked: true
  },
  {
    id: 'uk-ets-cost-comparison',
    framework: 'UK ETS',
    type: 'Cost Impact Analysis',
    formula: 'Annual_Cost = Emissions × Price_per_tonne × Coverage_Factor',
    variables: {
      current_uk_price: 65,
      EU_price_comparison: 118,
      cost_differential: 0.55,
      future_convergence: "potential alignment post-2030"
    },
    description: 'Cost impact analysis comparing UK ETS to EU ETS pricing',
    locked: false
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