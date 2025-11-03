import AppLayout from '@/layouts/app-layout';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import LogbookController from '@/actions/App/Http/Controllers/LogbookController';
import LogbookEvidenceController from '@/actions/App/Http/Controllers/LogbookEvidenceController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';



export type LogbookEvidenceRecord = App.Data.LogbookEvidence.LogbookEvidenceData;

export type LogbookEvidenceCollection = PaginationMeta & {
  data: App.Data.LogbookEvidence.LogbookEvidenceData[];
};

interface LogbookEvidenceEditProps {
  record: LogbookEvidenceRecord;
}

export default function LogbookEvidenceEdit({ record }: LogbookEvidenceEditProps) {
  const normalizeFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (_error) {
        return '';
      }
    }

    return String(value);
  };

  const normalizeSelectorItems = (payload: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(payload)) {
      return payload as Array<Record<string, unknown>>;
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidateKeys = ['data', 'records', 'items', 'results'];

      for (const key of candidateKeys) {
        const value = record[key];

        if (Array.isArray(value)) {
          return value as Array<Record<string, unknown>>;
        }

        if (
          value &&
          typeof value === 'object' &&
          Array.isArray((value as Record<string, unknown>).data)
        ) {
          return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
        }
      }

      for (const value of Object.values(record)) {
        if (Array.isArray(value)) {
          return value as Array<Record<string, unknown>>;
        }

        if (
          value &&
          typeof value === 'object' &&
          Array.isArray((value as Record<string, unknown>).data)
        ) {
          return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
        }
      }
    }

    return [];
  };

  const mapLogbookSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
    if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
      const data = (response as Record<string, unknown>).data;
      const normalized = normalizeSelectorItems(data);

      if (normalized.length > 0) {
        return normalized;
      }
    }

    const fallback = normalizeSelectorItems(response);

    if (fallback.length > 0) {
      return fallback;
    }

    return [];
  };

  const fetchLogbookOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(LogbookController.index().url, { params });

    return response;
  };

  const [logbookId, setLogbookId] = useState<number | string | null>(() => {
    const direct = record?.logbook_id;

    if (typeof direct === 'number' || typeof direct === 'string') {
      return direct;
    }

    const related = record?.logbook;

    if (related && typeof related === 'object' && 'id' in related) {
      return (related as { id?: number | string }).id ?? null;
    }

    return null;
  });

  return (
    <AppLayout>
      <Head title="Edit Logbook Evidence" />
      <Form {...LogbookEvidenceController.update.form(record.id)}
        transform={(data) => ({ ...data, logbook_id: (() => {
    if (logbookId === null) {
      return null;
    }

    if (typeof logbookId === 'number') {
      return logbookId;
    }

    const numeric = Number.parseInt(String(logbookId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Edit Logbook Evidence</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="filepath">Filepath</Label>
                <Textarea
                  id="filepath"
                  name="filepath"
                  rows={4}
                  required
                  defaultValue={normalizeFieldValue(record.filepath) as string}
                />
                <InputError message={errors.filepath} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logbook_id">Logbook</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="logbook-selector"
                  placeholder={`Select Logbook`}
                  fetchData={fetchLogbookOptions}
                  dataMapper={mapLogbookSelectorResponse}
                  selectedDataId={logbookId}
                  setSelectedData={(value) => setLogbookId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.logbook_id} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
