import AppLayout from '@/layouts/app-layout';
import DigitalEvidenceController from '@/actions/App/Http/Controllers/DigitalEvidenceController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import UserController from '@/actions/App/Http/Controllers/UserController';
import axios from 'axios';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';



export type DigitalEvidenceRecord = App.Data.DigitalEvidence.DigitalEvidenceData;

export type DigitalEvidenceCollection = PaginationMeta & {
  data: App.Data.DigitalEvidence.DigitalEvidenceData[];
};

interface DigitalEvidenceEditProps {
  record: DigitalEvidenceRecord;
}

export default function DigitalEvidenceEdit({ record }: DigitalEvidenceEditProps) {
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

  const mapUserSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
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

  const fetchUserOptions = async ({ search }: { search?: string }) => {
    const params: Record<string, unknown> = {};

    if (search && search.trim().length > 0) {
      params['filter[search]'] = search.trim();
    }

    const response = await axios.get(UserController.index().url, { params });

    return response;
  };

  const [userId, setUserId] = useState<number | string | null>(() => {
    const direct = record?.user_id;

    if (typeof direct === 'number' || typeof direct === 'string') {
      return direct;
    }

    const related = record?.user;

    if (related && typeof related === 'object' && 'id' in related) {
      return (related as { id?: number | string }).id ?? null;
    }

    return null;
  });

  return (
    <AppLayout>
      <Head title="Edit Digital Evidence" />
      <Form {...DigitalEvidenceController.update.form(record.id)}
        transform={(data) => ({ ...data, user_id: (() => {
    if (userId === null) {
      return null;
    }

    if (typeof userId === 'number') {
      return userId;
    }

    const numeric = Number.parseInt(String(userId), 10);
    return Number.isNaN(numeric) ? null : numeric;
  })() })}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Edit Digital Evidence</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Textarea
                  id="name"
                  name="name"
                  rows={4}
                  defaultValue={normalizeFieldValue(record.name) as string}
                />
                <InputError message={errors.name} />
              </div>

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
                <Label htmlFor="user_id">User</Label>
                <GenericDataSelector<Record<string, unknown>>
                  id="user-selector"
                  placeholder={`Select User`}
                  fetchData={fetchUserOptions}
                  dataMapper={mapUserSelectorResponse}
                  selectedDataId={userId}
                  setSelectedData={(value) => setUserId(value)}
                  renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                />
                <InputError message={errors.user_id} />
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
