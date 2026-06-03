import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, FileText, CheckCircle, AlertCircle, RefreshCw, HardDrive } from 'lucide-react';
import { useHybridClients } from '@/hooks/useHybridClients';

// ─── CP850 decode table ───────────────────────────────────────────────────────
const CP850: Record<number, string> = {
  0x80:'Ç',0x81:'ü',0x82:'é',0x83:'â',0x84:'ä',0x85:'à',0x86:'å',0x87:'ç',
  0x88:'ê',0x89:'ë',0x8A:'è',0x8B:'ï',0x8C:'î',0x8D:'ì',0x8E:'Ä',0x8F:'Å',
  0x90:'É',0x91:'æ',0x92:'Æ',0x93:'ô',0x94:'ö',0x95:'ò',0x96:'û',0x97:'ù',
  0x98:'ÿ',0x99:'Ö',0x9A:'Ü',0x9B:'ø',0x9C:'£',0x9D:'Ø',0x9E:'×',0x9F:'ƒ',
  0xA0:'á',0xA1:'í',0xA2:'ó',0xA3:'ú',0xA4:'ñ',0xA5:'Ñ',0xA6:'ª',0xA7:'º',
  0xA8:'¿',0xA9:'®',0xAA:'¬',0xAB:'½',0xAC:'¼',0xAD:'¡',0xAE:'«',0xAF:'»',
  0xB5:'Á',0xD6:'Í',0xE0:'Ó',0xE9:'Ú',0xA4:'ñ',0xA5:'Ñ',
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

function parseDbf(buffer: ArrayBuffer): Record<string, string>[] {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const numRecords = view.getUint32(4, true);
  const headerSize = view.getUint16(8, true);
  const recordSize = view.getUint16(10, true);

  const fields: { name: string; length: number; offset: number }[] = [];
  let fieldOffset = 1;
  let pos = 32;
  while (pos < headerSize - 1 && bytes[pos] !== 0x0D) {
    const name = decodeCp850(bytes.slice(pos, pos + 11));
    const length = bytes[pos + 16];
    fields.push({ name, length, offset: fieldOffset });
    fieldOffset += length;
    pos += 32;
  }

  const records: Record<string, string>[] = [];
  for (let i = 0; i < numRecords; i++) {
    const recStart = headerSize + i * recordSize;
    if (recStart + recordSize > bytes.length) break;
    if (bytes[recStart] === 0x2A) continue; // deleted
    const record: Record<string, string> = {};
    for (const field of fields) {
      record[field.name] = decodeCp850(bytes.slice(recStart + field.offset, recStart + field.offset + field.length));
    }
    records.push(record);
  }
  return records;
}

function parseDbfDate(raw: string): string {
  if (!raw || raw.length !== 8) return new Date().toISOString().split('T')[0];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

// ─── Backup helpers ───────────────────────────────────────────────────────────
const getAllDataFromStore = (db: IDBDatabase, storeName: string): Promise<any[]> =>
  new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch { resolve([]); }
  });

const openDB = (name: string, version: number): Promise<IDBDatabase | null> =>
  new Promise((resolve) => {
    const req = indexedDB.open(name, version);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onupgradeneeded = () => {}; // just open, don't create
  });

// ─── Import stats ─────────────────────────────────────────────────────────────
interface ImportStats {
  total: number; imported: number; skipped: number; withEmail: number; withPhone: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ConfigurationManager = () => {
  const { toast } = useToast();
  const { importClients, refreshData, localClientCount } = useHybridClients();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbfInputRef = useRef<HTMLInputElement>(null);

  // DBF import state
  const [isImportingDbf, setIsImportingDbf] = useState(false);
  const [dbfProgress, setDbfProgress] = useState(0);
  const [dbfStats, setDbfStats] = useState<ImportStats | null>(null);
  const [dbfError, setDbfError] = useState<string | null>(null);

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // ── DBF import ──────────────────────────────────────────────────────────────
  const handleDbfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.dbf')) {
      toast({ title: 'Formato incorrecto', description: 'Seleccioná un archivo .DBF', variant: 'destructive' });
      return;
    }

    setIsImportingDbf(true);
    setDbfStats(null);
    setDbfError(null);
    setDbfProgress(10);

    try {
      const buffer = await file.arrayBuffer();
      setDbfProgress(30);

      const records = parseDbf(buffer);
      setDbfProgress(55);

      const clientsData = [];
      let skipped = 0, withEmail = 0, withPhone = 0;

      for (const rec of records) {
        const dni = (rec['DNI'] || '').trim();
        if (!dni || dni === '0') { skipped++; continue; }

        const apellido = (rec['APELLIDO'] || '').trim();
        const nombres  = (rec['NOMBRES']  || '').trim();
        const nombre   = apellido && nombres ? `${apellido}, ${nombres}` : apellido || nombres || 'Sin nombre';
        const mail     = (rec['MAIL']     || '').trim() || null;
        const celular  = (rec['CELULAR']  || '').trim() || null;
        const telefono = (rec['TELEFONO'] || '').trim() || null;
        const tel      = celular || telefono || null;

        if (mail) withEmail++;
        if (tel)  withPhone++;

        clientsData.push({
          id: crypto.randomUUID(),
          numero_cliente: (rec['NRO_SOCIO'] || '').trim(),
          nombre,
          documento: dni,
          email: mail,
          telefono: tel,
          fecha_ingreso: parseDbfDate(rec['FECHA_ING'] || ''),
          has_active_routine: false,
          last_routine_access: null,
          comentarios: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setDbfProgress(75);
      const result = await importClients(clientsData);
      setDbfProgress(100);

      if (result.success) {
        setDbfStats({ total: records.length, imported: clientsData.length, skipped, withEmail, withPhone });
        toast({ title: '✅ Importación exitosa', description: `${clientsData.length.toLocaleString()} socios importados` });
      } else {
        setDbfError(result.message);
        toast({ title: 'Error en la importación', description: result.message, variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setDbfError(msg);
      toast({ title: 'Error al procesar el archivo', description: msg, variant: 'destructive' });
    } finally {
      setIsImportingDbf(false);
      event.target.value = '';
    }
  };

  // ── Backup export ───────────────────────────────────────────────────────────
  const exportAllData = async () => {
    setIsExporting(true);
    try {
      const backup: Record<string, any> = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        indexedDB: {},
      };

      // DB name → stores
      const databases: [string, number, string[]][] = [
        ['GymApp',         3, ['clients', 'professors']],
        ['GymLocalDB',     2, ['routines', 'templates']],
        ['GymExercisesDB', 1, ['exercises', 'categories', 'equipment']],
        ['GymAppAuth',     1, ['users']],
      ];

      for (const [name, ver, stores] of databases) {
        const db = await openDB(name, ver);
        if (!db) continue;
        backup.indexedDB[name] = {};
        for (const store of stores) {
          backup.indexedDB[name][store] = await getAllDataFromStore(db, store);
        }
        db.close();
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `urban-gym-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Backup descargado', description: 'El archivo de respaldo se descargó correctamente' });
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo crear el backup', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Backup restore ──────────────────────────────────────────────────────────
  const restoreBackup = async (file: File) => {
    setIsRestoringBackup(true);
    try {
      const backup = JSON.parse(await file.text());
      if (!backup.version || !backup.exportDate) throw new Error('Archivo de backup inválido');

      if (backup.indexedDB) {
        for (const [dbName, stores] of Object.entries(backup.indexedDB as Record<string, Record<string, any[]>>)) {
          const storeNames = Object.keys(stores);
          // Open with high version to ensure stores exist
          const db: IDBDatabase = await new Promise((resolve, reject) => {
            const req = indexedDB.open(dbName, 99);
            req.onupgradeneeded = (e) => {
              const d = (e.target as IDBOpenDBRequest).result;
              storeNames.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
          });

          for (const [storeName, data] of Object.entries(stores)) {
            await new Promise<void>((resolve, reject) => {
              const tx    = db.transaction(storeName, 'readwrite');
              const store = tx.objectStore(storeName);
              store.clear();
              (data as any[]).forEach(item => store.put(item));
              tx.oncomplete = () => resolve();
              tx.onerror    = () => reject(tx.error);
            });
          }
          db.close();
        }
      }

      toast({ title: 'Restauración completada', description: 'Los datos se restauraron correctamente. Recargando...' });
      sessionStorage.setItem('gym_restore_view', 'configuracion');
      setTimeout(() => window.location.reload(), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast({ title: 'Error al restaurar', description: msg, variant: 'destructive' });
    } finally {
      setIsRestoringBackup(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast({ title: 'Error', description: 'Seleccioná un archivo .json válido', variant: 'destructive' });
      return;
    }
    if (window.confirm('¿Estás seguro de restaurar este backup? Se sobrescribirán TODOS los datos actuales.')) {
      restoreBackup(file);
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-1">Gestión de datos, importación y copias de seguridad</p>
      </div>

      {/* ── Importar socios DBF ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Importar Socios desde DBF
          </CardTitle>
          <CardDescription>
            Cargá el archivo <strong>SOCIOS.DBF</strong> directamente — sin conversiones previas.
            El sistema lee el formato DBF y decodifica los caracteres automáticamente (CP850).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Estado actual */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-sm text-gray-700">
              Base local activa —{' '}
              <strong>{localClientCount.toLocaleString()}</strong> socio{localClientCount !== 1 ? 's' : ''} almacenado{localClientCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Botón */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={dbfInputRef}
              type="file"
              accept=".dbf,.DBF"
              onChange={handleDbfUpload}
              disabled={isImportingDbf}
              className="hidden"
            />
            <Button
              onClick={() => dbfInputRef.current?.click()}
              disabled={isImportingDbf}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImportingDbf ? 'Importando...' : 'Seleccionar SOCIOS.DBF'}
            </Button>
            <Button
              variant="outline"
              onClick={async () => { await refreshData(); toast({ title: 'Lista actualizada' }); }}
              disabled={isImportingDbf}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar lista
            </Button>
          </div>

          {/* Progreso */}
          {isImportingDbf && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                <span>
                  {dbfProgress < 30 ? 'Leyendo archivo...'
                    : dbfProgress < 55 ? 'Decodificando registros...'
                    : dbfProgress < 75 ? 'Procesando socios...'
                    : 'Guardando en base de datos...'}
                </span>
              </div>
              <Progress value={dbfProgress} className="w-full" />
            </div>
          )}

          {/* Resultado */}
          {dbfStats && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle className="h-5 w-5" />
                Importación completada
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Total en archivo',      value: dbfStats.total,     color: 'text-gray-700' },
                  { label: 'Importados',             value: dbfStats.imported,  color: 'text-green-700 font-bold' },
                  { label: 'Omitidos (sin DNI)',     value: dbfStats.skipped,   color: 'text-amber-600' },
                  { label: 'Con email',              value: dbfStats.withEmail, color: 'text-blue-600' },
                  { label: 'Con teléfono/celular',   value: dbfStats.withPhone, color: 'text-blue-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-md border border-green-100 p-3">
                    <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dbfError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dbfError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Backup ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            Copia de Seguridad
          </CardTitle>
          <CardDescription>
            Descargá un backup completo de todos los datos o restaurá uno anterior.
            Incluye clientes, rutinas, ejercicios, profesores y usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            El backup se guarda como un archivo <strong>.json</strong> en tu computadora.
            Guardalo en un lugar seguro para poder restaurar los datos si es necesario.
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={exportAllData}
              disabled={isExporting || isRestoringBackup}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Descargar Backup'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBackupFileSelect}
              accept=".json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting || isRestoringBackup}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isRestoringBackup ? 'Restaurando...' : 'Restaurar Backup'}
            </Button>
          </div>
          {isRestoringBackup && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
              Restaurando datos...
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Info almacenamiento ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-orange-500" />
            Almacenamiento Local
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-800">Modo de operación:</strong> 100% local — no requiere internet ni servidor externo.</p>
            <p><strong className="text-gray-800">Motor de datos:</strong> IndexedDB (integrado en el navegador).</p>
            <p><strong className="text-gray-800">Bases de datos:</strong> GymApp (clientes y profesores), GymLocalDB (rutinas), GymExercisesDB (ejercicios), GymAppAuth (usuarios).</p>
            <p><strong className="text-gray-800">Recomendación:</strong> Realizá un backup periódico de tus datos para evitar pérdidas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationManager;
