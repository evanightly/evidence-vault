import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import ShiftController from '@/actions/App/Http/Controllers/ShiftController';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';



export type ShiftRecord = App.Data.Shift.ShiftData;

export type ShiftCollection = PaginationMeta & {
  data: App.Data.Shift.ShiftData[];
};

interface ShiftCreateProps {}

export default function ShiftCreate() {
  return (
    <AppLayout>
      <Head title="Create Shift" />
      <Form {...ShiftController.store.form()}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Create Shift</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                />
                <InputError message={errors.name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  required
                />
                <InputError message={errors.start_time} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  required
                />
                <InputError message={errors.end_time} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
