import type { UsersService } from './users.service';
import type { CsvImportResult } from './users.types';

/**
 * Minimal zero-dependency RFC-compliant CSV parser.
 * Handles quotes, commas inside quotes, escaped quotes (""), and multiple newline formats (\r\n, \n).
 */
export function parseCsv(csvText: string): Array<Record<string, string>> {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  const text = csvText.trim();
  if (!text) return [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((val) => val.length > 0)) lines.push(currentRow);
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((val) => val.length > 0)) lines.push(currentRow);
  }

  const headerRow = lines[0];
  if (!headerRow || lines.length < 2) return [];

  const headers = headerRow.map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Array<Record<string, string>> = [];

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r];
    if (!row) continue;
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const val = row[idx];
      record[header] = val ? val.replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(record);
  }

  return rows;
}

export async function importFacultyFromRows(
  service: UsersService,
  rows: Array<Record<string, string>>,
  actorId?: string,
  ipAddress?: string,
): Promise<CsvImportResult> {
  const result: CsvImportResult = { totalRows: rows.length, successCount: 0, failureCount: 0, errors: [] };

  let idx = 0;
  for (const r of rows) {
    idx++;
    const rowNum = idx + 1;
    const email = r['email']?.trim().toLowerCase();
    const firstName = r['firstName']?.trim();
    const lastName = r['lastName']?.trim();
    const employeeId = r['employeeId']?.trim();
    const departmentId = r['departmentId']?.trim();

    if (!email || !firstName || !lastName || !employeeId || !departmentId) {
      result.failureCount++;
      result.errors.push({
        row: rowNum,
        identifier: email || employeeId,
        reason: 'Missing required fields (email, firstName, lastName, employeeId, departmentId)',
      });
      continue;
    }

    try {
      await service.createFaculty(
        {
          email,
          firstName,
          lastName,
          employeeId,
          departmentId,
          phone: r['phone']?.trim() || undefined,
          designation: r['designation']?.trim() || undefined,
          joiningDate: r['joiningDate']?.trim() || undefined,
        },
        actorId,
        ipAddress,
      );
      result.successCount++;
    } catch (err: unknown) {
      result.failureCount++;
      const message = err instanceof Error ? err.message : 'Failed to import row';
      result.errors.push({ row: rowNum, identifier: email || employeeId, reason: message });
    }
  }

  return result;
}

export async function importStudentsFromRows(
  service: UsersService,
  rows: Array<Record<string, string>>,
  actorId?: string,
  ipAddress?: string,
): Promise<CsvImportResult> {
  const result: CsvImportResult = { totalRows: rows.length, successCount: 0, failureCount: 0, errors: [] };

  let idx = 0;
  for (const r of rows) {
    idx++;
    const rowNum = idx + 1;
    const email = r['email']?.trim().toLowerCase();
    const firstName = r['firstName']?.trim();
    const lastName = r['lastName']?.trim();
    const rollNumber = r['rollNumber']?.trim();
    const courseId = r['courseId']?.trim();
    const semesterId = r['semesterId']?.trim();
    const sectionId = r['sectionId']?.trim();
    const admissionYear = Number(r['admissionYear']?.trim());

    if (!email || !firstName || !lastName || !rollNumber || !courseId || !semesterId || !sectionId || !admissionYear) {
      result.failureCount++;
      result.errors.push({
        row: rowNum,
        identifier: email || rollNumber,
        reason: 'Missing required fields (email, firstName, lastName, rollNumber, courseId, semesterId, sectionId, admissionYear)',
      });
      continue;
    }

    try {
      await service.createStudent(
        {
          email,
          firstName,
          lastName,
          rollNumber,
          courseId,
          semesterId,
          sectionId,
          admissionYear,
          phone: r['phone']?.trim() || undefined,
          dateOfBirth: r['dateOfBirth']?.trim() || undefined,
          guardianName: r['guardianName']?.trim() || undefined,
          guardianPhone: r['guardianPhone']?.trim() || undefined,
        },
        actorId,
        ipAddress,
      );
      result.successCount++;
    } catch (err: unknown) {
      result.failureCount++;
      const message = err instanceof Error ? err.message : 'Failed to import row';
      result.errors.push({ row: rowNum, identifier: email || rollNumber, reason: message });
    }
  }

  return result;
}
