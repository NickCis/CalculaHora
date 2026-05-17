import { googleFetch } from '@/lib/google/api'
import { SHEET_NAMES, boolToSheet } from './schema'

export async function initializeWorkspaceSpreadsheet(
  spreadsheetId: string,
  name: string,
  timezone: string,
  timeFormat: '24' | '12' = '24',
): Promise<void> {
  const meta = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
  )
  const sheetData = (await meta.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>
  }
  const defaultSheetId = sheetData.sheets?.[0]?.properties?.sheetId ?? 0

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: defaultSheetId, title: SHEET_NAMES.workspace },
              fields: 'title',
            },
          },
          { addSheet: { properties: { title: SHEET_NAMES.projects } } },
          { addSheet: { properties: { title: SHEET_NAMES.timeTracker } } },
        ],
      }),
    },
  )

  const values = {
    [SHEET_NAMES.workspace]: [
      ['key', 'value'],
      ['version', '1'],
      ['name', name],
      ['timezone', timezone],
      ['timeFormat', timeFormat],
    ],
    [SHEET_NAMES.projects]: [
      ['id', 'name', 'billableDefault', 'currency', 'rate', 'color'],
    ],
    [SHEET_NAMES.timeTracker]: [
      ['id', 'startTime', 'endTime', 'title', 'projectId', 'billable', 'currency', 'rate'],
    ],
  }

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: Object.entries(values).map(([range, rows]) => ({
          range: `'${range}'!A1`,
          majorDimension: 'ROWS',
          values: rows,
        })),
      }),
    },
  )
}

export { boolToSheet }
