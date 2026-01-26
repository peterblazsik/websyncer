# XLSX Document Processing

A skill for reading, analyzing, and manipulating Excel spreadsheet files (.xlsx, .xls).

## When to Use

Use this skill when:
- Reading Excel files to extract data
- Analyzing spreadsheet data (tax records, travel logs, financial data)
- Converting Excel data to other formats (JSON, CSV, Markdown tables)
- Tracking tax residency days between locations (e.g., AMS/VIE)
- Processing personal financial spreadsheets

## Capabilities

### Reading Excel Files

Use the `Read` tool to open `.xlsx` files - they will be parsed and displayed as readable data.

```bash
# Read an Excel file
Read: /path/to/spreadsheet.xlsx
```

### Common Use Cases

#### 1. Tax Residency Tracking

Track days spent in different tax jurisdictions:

```markdown
| Month | Days in AMS | Days in VIE | Days Other | Notes |
|-------|-------------|-------------|------------|-------|
| Jan   | 15          | 10          | 6          | Trip to DE |
| Feb   | 20          | 8           | 0          |        |
```

**Key thresholds to monitor:**
- 183-day rule for tax residency
- Tie-breaker rules for dual residency
- Social security coordination

#### 2. Travel Day Calculations

```python
# Sum travel days by location
total_ams = sum(days_in_ams)
total_vie = sum(days_in_vie)
remaining_ams = 183 - total_ams  # Days available before residency trigger
```

#### 3. Financial Analysis

Parse expense/income sheets:
- Categorize transactions
- Calculate totals by category
- Generate summaries for tax filing

### Data Extraction Patterns

When processing Excel data:

1. **Identify headers** - First row typically contains column names
2. **Detect data types** - Numbers, dates, text, formulas
3. **Handle merged cells** - Note any merged regions
4. **Process multiple sheets** - Check all worksheet tabs

### Output Formats

Convert Excel data to:

| Format | Use Case |
|--------|----------|
| Markdown table | Documentation, reports |
| JSON | API integration, data processing |
| CSV | Import to other tools |
| Summary stats | Quick analysis |

### Example Workflow

```
User: "Analyze my travel-2024.xlsx and tell me how many days I spent in each country"

1. Read the Excel file
2. Identify date and location columns
3. Calculate days per location
4. Present summary with tax implications
```

### Tax Residency Helper

For cross-border situations (e.g., Netherlands/Austria):

**Netherlands (AMS):**
- 183+ days = tax resident
- Social ties considered
- Employment location matters

**Austria (VIE):**
- 183+ days = tax resident
- Center of vital interests
- Habitual abode rules

**Recommendations:**
- Keep detailed travel logs
- Document work-from-home days
- Track overnight stays specifically
- Note business vs. personal travel

## Limitations

- Cannot modify Excel files directly (use export to CSV, edit, re-import)
- Complex formulas shown as values
- Macros/VBA not executed
- Very large files may need pagination
