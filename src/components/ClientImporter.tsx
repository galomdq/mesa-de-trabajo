import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Database, RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useHybridClients } from '@/hooks/useHybridClients';
import { useToast } from '@/hooks/use-toast';

// ─── CP850 decode table ───────────────────────────────────────────────────────
// Maps bytes 0x80–0xFF from CP850 (DOS Latin) to Unicode
const CP850: Record<number, string> = {
  0x80:'Ç',0x81:'ü',0x82:'é',0x83:'â',0x84:'ä',0x85:'à',0x86:'å',0x87:'ç',
  0x88:'ê',0x89:'ë',0x8A:'è',0x8B:'ï',0x8C:'î',0x8D:'ì',0x8E:'Ä',0x8F:'Å',
  0x90:'É',0x91:'æ',0x92:'Æ',0x93:'ô',0x94:'ö',0x95:'ò',0x96:'û',0x97:'ù',
  0x98:'ÿ',0x99:'Ö',0x9A:'Ü',0x9B:'ø',0x9C:'£',0x9D:'Ø',0x9E:'×',0x9F:'ƒ',
  0xA0:'á',0xA1:'í',0xA2:'ó',0xA3:'ú',0xA4:'ñ',0xA5:'Ñ',0xA6:'ª',0xA7:'º',
  0xA8:'¿',0xA9:'®',0xAA:'¬',0xAB:'½',0xAC:'¼',0xAD:'¡',0xAE:'«',0xAF:'»',
  0xB0:'░',0xB1:'▒',0xB2:'▓',0xB3:'│',0xB4:'┤',0xB5:'Á',0xB6:'Â',0xB7:'À',
  0xB8:'©',0xB9:'╣',0xBA:'║',0xBB:'╗',0xBC:'╝',0xBD:'¢',0xBE:'¥',0xBF:'┐',
  0xC0:'└',0xC1:'┴',0xC2:'┬',0xC3:'├',0xC4:'─',0xC5:'┼',0xC6:'ã',0xC7:'Ã',
  0xC8:'╚',0xC9:'╔',0xCA:'╩',0xCB:'╦',0xCC:'╠',0xCD:'═',0xCE:'╬',0xCF:'¤',
  0xD0:'ð',0xD1:'Ð',0xD2:'Ê',0xD3:'Ë',0xD4:'È',0xD5:'ı',0xD6:'Í',0xD7:'Î',
  0xD8:'Ï',0xD9:'┘',0xDA:'┌',0xDB:'█',0xDC:'▄',0xDD:'¦',0xDE:'Ì',0xDF:'▀',
  0xE0:'Ó',0xE1:'ß',0xE2:'Ô',0xE3:'Õ',0xE4:'õ',0xE5:'õ',0xE6:'µ',0xE7:'þ',
  0xE8:'Þ',0xE9:'Ú',0xEA:'Û',0xEB:'Ù',0xEC:'ý',0xED:'Ý',0xEE:'¯',0xEF:'´',
  0xF0:'­',0xF1:'±',0xF2:'‗',0xF3:'¾',0xF4:'¶',0xF5:'§',0xF6:'÷',0xF7:'¸',
  0xF8:'°',0xF9:'¨',0xFA:'·',0xFB:'¹',0xFC:'³',0xFD:'²',0xFE:'■',0xFF:' ',
};

function decodeCp850(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0) break;
    if (b < 0x80) result += String.fromCharCode(b);
    else result += CP850[b] ?? '?';
  }
  return result.trim();
}

// ─── DBF parser ──────────────────────────────────────────────────────────────
interface DbfField {
  name: string;
  type: string;
  length: number;
  offset: number;
}

interface DbfRecord {
  [key: string]: string;
}

function parseDbf(buffer: ArrayBuffer): DbfRecord[] {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const numRecords = view.getUint32(4, true);
  const headerSize = view.getUint16(8, true);
  const recordSize = view.getUint16(10, true);

  // Parse field descriptors (32 bytes each, starting at byte 32)
  const fields: DbfField[] = [];
  let fieldOffset = 1; // byte 0 of each record = deletion flag
  let pos = 32;

  while (pos < headerSize - 1 && bytes[pos] !== 0x0D) {
    const nameBytes = bytes.slice(pos, pos + 11);
    const name = decodeCp850(nameBytes);
    const type = String.fromCharCode(bytes[pos + 11]);
    const length = bytes[pos + 16];

    fields.push({ name, type, length, offset: fieldOffset });
    fieldOffset += length;
    pos += 32;
  }

  // Parse records
  const records: DbfRecord[] = [];
  for (let i = 0; i < numRecords; i++) {
    const recStart = headerSize + i * recordSize;
    if (recStart + recordSize > bytes.length) break;

    // Skip deleted records (flag = 0x2A = '*')
    if (bytes[recStart] === 0x2A) continue;

    const record: DbfRecord = {};
    for (const field of fields) {
      const fieldBytes = bytes.slice(recStart + field.offset, recStart + field.offset + field.length);
      record[field.name] = decodeCp850(fieldBytes);
    }
    records.push(record);
  }

  return records;
}

// ─── Date parser: YYYYMMDD → YYYY-MM-DD ──────────────────────────────────────
function parseDbfDate(raw: string): string {
  if (!raw || raw.length !== 8) return new Date().toISOString().split('T')[0];
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  if (isNaN(Number(y)) || isNaN(Number(m)) || isNaN(Number(d))) {
    return new Date().toISOString().split('T')[0];
  }
  return `${y}-${m}-${d}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  withEmail: number;
  withPhone: number;
}

const ClientImporter: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { importClients, refreshData, localClientCount } = useHybridClients();
  const { toast } = useToast();

  const handleDbfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.dbf')) {
      toast({
        title: 'Formato incorrecto',
        description: 'Seleccioná un archivo .DBF',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportStats(null);
    setImportError(null);
    setProgress(10);

    try {
      const buffer = await file.arrayBuffer();
      setProgress(30);

      const records = parseDbf(buffer);
      setProgress(55);

      const clientsData = [];
      let skipped = 0;
      let withEmail = 0;
      let withPhone = 0;

      for (const rec of records) {
        const dni = (rec['DNI'] || '').trim();
        if (!dni || dni === '0') {
          skipped++;
          continue;
        }

        const apellido = (rec['APELLIDO'] || '').trim();
        const nombres = (rec['NOMBRES'] || '').trim();
        const nombreCompleto = apellido && nombres
          ? `${apellido}, ${nombres}`
          : apellido || nombres || 'Sin nombre';

        const mail = (rec['MAIL'] || '').trim() || null;
        const telefono = (rec['TELEFONO'] || '').trim() || null;
        const celular = (rec['CELULAR'] || '').trim() || null;
        const telefonoFinal = celular || telefono || null;

        if (mail) withEmail++;
        if (telefonoFinal) withPhone++;

        clientsData.push({
          id: crypto.randomUUID(),
          numero_cliente: (rec['NRO_SOCIO'] || '').trim(),
          nombre: nombreCompleto,
          documento: dni,
          email: mail,
          telefono: telefonoFinal,
          fecha_ingreso: parseDbfDate(rec['FECHA_ING'] || ''),
          has_active_routine: false,
          last_routine_access: null,
          comentarios: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setProgress(75);
      const result = await importClients(clientsData);
      setProgress(100);

      if (result.success) {
        setImportStats({
          total: records.length,
          imported: clientsData.length,
          skipped,
          withEmail,
          withPhone,
        });
        toast({
          title: '✅ Importación exitosa',
          description: `${clientsData.length} socios importados correctamente`,
        });
      } else {
        setImportError(result.message);
        toast({
          title: 'Error en la importación',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setImportError(msg);
      toast({
        title: 'Error al procesar el archivo',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleRefresh = async () => {
    await refreshData();
    toast({ title: 'Lista actualizada' });
  };

  return (
    <div className="space-y-6">
      {/* ── Importar DBF ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            Importación de Socios desde DBF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Seleccioná el archivo <strong>SOCIOS.DBF</strong> directamente — no hace falta
              convertirlo. El sistema lee el formato DBF y detecta automáticamente la
              codificación de caracteres (CP850).
            </AlertDescription>
          </Alert>

          {/* Botones */}
          <div className="flex items-center gap-4 flex-wrap">
            <input
              id="dbf-upload"
              type="file"
              accept=".dbf,.DBF"
              onChange={handleDbfUpload}
              disabled={isImporting}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('dbf-upload')?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importando...' : 'Seleccionar SOCIOS.DBF'}
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar lista
            </Button>
          </div>

          {/* Progreso */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                <span>
                  {progress < 30
                    ? 'Leyendo archivo...'
                    : progress < 55
                    ? 'Decodificando registros...'
                    : progress < 75
                    ? 'Procesando socios...'
                    : 'Guardando en base de datos...'}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Resultado exitoso */}
          {importStats && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle className="h-5 w-5" />
                Importación completada
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Total en archivo', value: importStats.total, color: 'text-gray-700' },
                  { label: 'Importados', value: importStats.imported, color: 'text-green-700 font-bold' },
                  { label: 'Omitidos (sin DNI)', value: importStats.skipped, color: 'text-amber-600' },
                  { label: 'Con email', value: importStats.withEmail, color: 'text-blue-600' },
                  { label: 'Con teléfono/celular', value: importStats.withPhone, color: 'text-blue-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-md border border-green-100 p-3">
                    <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Estado local ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado del almacenamiento local</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-sm text-gray-700">
              Base de datos local activa —{' '}
              <strong>{localClientCount.toLocaleString()}</strong>{' '}
              socio{localClientCount !== 1 ? 's' : ''} almacenado{localClientCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Todos los datos se guardan localmente en tu navegador (IndexedDB).
            No se requiere conexión a internet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientImporter;
