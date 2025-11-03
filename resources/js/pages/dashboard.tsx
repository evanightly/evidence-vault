import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { NumberTicker } from '@/components/ui/number-ticker';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type DashboardMetrics = App.Data.Dashboard.DashboardData;
type CountByLabel = App.Data.Dashboard.CountByLabelData;

interface RoleChartDatum {
    key: string;
    label: string;
    value: number;
    fill: string;
}

interface DashboardProps {
    metrics: DashboardMetrics;
}

const COLOR_PALETTE = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2', '#db2777'];

const parseDateInput = (value?: string | null): Date | undefined => {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(`${value}T00:00:00`);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDateForQuery = (value: Date | null | undefined): string | null => {
    if (!value) {
        return null;
    }

    return format(value, 'yyyy-MM-dd');
};

export default function Dashboard({ metrics }: DashboardProps) {
    const isManager = metrics.active_role === 'Admin' || metrics.active_role === 'SuperAdmin';

    const handleRangeChange = useCallback(
        (payload: { range: DateRange; rangeCompare?: DateRange }) => {
            const nextFrom = formatDateForQuery(payload.range.from ?? undefined);
            const nextTo = formatDateForQuery(payload.range.to ?? payload.range.from ?? undefined);

            const currentFrom = metrics.filters.date_from ?? null;
            const currentTo = metrics.filters.date_to ?? null;

            if (nextFrom === currentFrom && nextTo === currentTo) {
                return;
            }

            router.get(
                dashboard({
                    query: {
                        date_from: nextFrom,
                        date_to: nextTo,
                    },
                }).url,
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        },
        [metrics.filters.date_from, metrics.filters.date_to],
    );

    const workLocationChartConfig = useMemo<ChartConfig>(
        () => ({
            count: {
                label: 'Jumlah Log',
                color: 'var(--primary)',
            },
        }),
        [],
    );

    const workLocationChartData = useMemo<{ label: string; count: number }[]>(
        () =>
            metrics.logs_per_work_location.map((item: CountByLabel) => ({
                label: item.label,
                count: item.count,
            })),
        [metrics.logs_per_work_location],
    );

    const employeeChartData = useMemo<{ label: string; count: number }[]>(
        () =>
            metrics.logs_per_employee.map((item: CountByLabel) => ({
                label: item.label,
                count: item.count,
            })),
        [metrics.logs_per_employee],
    );

    const roleChartData = useMemo<RoleChartDatum[]>(
        () =>
            metrics.employees_per_role.map((item: CountByLabel, index: number) => ({
                key: `${item.label}-${index}`,
                label: item.label,
                value: item.count,
                fill: COLOR_PALETTE[index % COLOR_PALETTE.length],
            })),
        [metrics.employees_per_role],
    );

    const roleChartConfig = useMemo<ChartConfig>(
        () => ({
            value: {
                label: 'Jumlah Pengguna',
                color: 'var(--primary)',
            },
        }),
        [],
    );

    const locationList = useMemo<CountByLabel[]>(() => metrics.logs_per_work_location.slice(0, 8), [metrics.logs_per_work_location]);

    const initialDateFrom = parseDateInput(metrics.filters.date_from ?? undefined);
    const initialDateTo = parseDateInput(metrics.filters.date_to ?? undefined);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Dashboard' />
            <div className='mt-8 flex flex-1 flex-col gap-6'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div className='space-y-1'>
                        <h1 className='text-2xl font-semibold text-foreground'>Dasbor</h1>
                        <p className='text-sm text-muted-foreground'>Pantau ringkasan aktivitas logbook sesuai rentang tanggal yang dipilih.</p>
                    </div>
                    <div className='w-full max-w-sm sm:w-auto'>
                        <DateRangePicker
                            onUpdate={handleRangeChange}
                            initialDateFrom={initialDateFrom}
                            initialDateTo={initialDateTo}
                            locale='id-ID'
                            placeholder='Pilih rentang tanggal'
                        />
                    </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Log</CardTitle>
                            <CardDescription>Jumlah entri logbook pada rentang tanggal terpilih.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NumberTicker value={metrics.totals.total_logs} className='text-3xl font-semibold' />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lokasi Aktif</CardTitle>
                            <CardDescription>Lokasi kerja yang memiliki log selama rentang tersebut.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NumberTicker value={metrics.logs_per_work_location.length} className='text-3xl font-semibold' />
                        </CardContent>
                    </Card>

                    {isManager && metrics.totals.active_employees !== null && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Teknisi Aktif</CardTitle>
                                <CardDescription>Jumlah teknisi yang berkontribusi pada log di rentang ini.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NumberTicker value={metrics.totals.active_employees} className='text-3xl font-semibold' />
                            </CardContent>
                        </Card>
                    )}

                    {isManager && metrics.totals.total_employees !== null && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Pengguna</CardTitle>
                                <CardDescription>Total akun berdasarkan peran di dalam sistem.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NumberTicker value={metrics.totals.total_employees} className='text-3xl font-semibold' />
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className='grid gap-4 lg:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Log per Lokasi</CardTitle>
                            <CardDescription>Tampilan jumlah logbook berdasarkan lokasi kerja.</CardDescription>
                        </CardHeader>
                        <CardContent className='h-[320px] px-0 pb-6'>
                            {workLocationChartData.length === 0 ? (
                                <p className='px-6 text-sm text-muted-foreground'>Belum ada data log untuk ditampilkan.</p>
                            ) : (
                                <ChartContainer config={workLocationChartConfig} className='h-full'>
                                    <BarChart data={workLocationChartData} barCategoryGap={24} margin={{ top: 16, right: 24, left: 8, bottom: 24 }}>
                                        <CartesianGrid strokeDasharray='4 4' vertical={false} />
                                        <XAxis dataKey='label' tickLine={false} axisLine={false} fontSize={12} interval={0} angle={-20} dy={24} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey='count' fill='var(--color-1)' radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>

                    {isManager ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Log per Teknisi</CardTitle>
                                <CardDescription>10 teknisi dengan jumlah log terbanyak pada rentang ini.</CardDescription>
                            </CardHeader>
                            <CardContent className='h-[320px] px-0 pb-6'>
                                {employeeChartData.length === 0 ? (
                                    <p className='px-6 text-sm text-muted-foreground'>Belum ada data teknisi untuk ditampilkan.</p>
                                ) : (
                                    <ChartContainer config={workLocationChartConfig} className='h-full'>
                                        <BarChart
                                            data={employeeChartData}
                                            layout='vertical'
                                            margin={{ top: 16, right: 24, left: 16, bottom: 16 }}
                                            barCategoryGap={16}
                                        >
                                            <CartesianGrid strokeDasharray='4 4' horizontal={false} />
                                            <XAxis type='number' allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} />
                                            <YAxis type='category' dataKey='label' axisLine={false} tickLine={false} width={140} fontSize={12} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey='count' fill='var(--color-2)' radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Lokasi</CardTitle>
                                <CardDescription>Lokasi aktivitas logbook pribadi Anda.</CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                                {locationList.length === 0 ? (
                                    <p className='text-sm text-muted-foreground'>Belum ada catatan logbook yang ditemukan.</p>
                                ) : (
                                    <div className='space-y-3'>
                                        {locationList.map((item: CountByLabel) => (
                                            <div
                                                key={`location-${item.label}`}
                                                className='flex items-center justify-between rounded-lg border px-4 py-3'
                                            >
                                                <span className='text-sm font-medium text-foreground'>{item.label}</span>
                                                <span className='text-sm text-muted-foreground'>{item.count} log</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {isManager && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Pengguna per Peran</CardTitle>
                            <CardDescription>Distribusi akun di seluruh sistem berdasarkan peran.</CardDescription>
                        </CardHeader>
                        <CardContent className='h-[340px] px-0 pb-6'>
                            {roleChartData.length === 0 ? (
                                <p className='px-6 text-sm text-muted-foreground'>Belum ada data pengguna untuk ditampilkan.</p>
                            ) : (
                                <ChartContainer config={roleChartConfig} className='mx-auto aspect-square max-h-full max-w-xl'>
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie
                                            data={roleChartData}
                                            dataKey='value'
                                            nameKey='label'
                                            innerRadius={70}
                                            outerRadius={120}
                                            strokeWidth={2}
                                            paddingAngle={2}
                                        >
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                        const total = roleChartData.reduce<number>((sum, entry) => sum + entry.value, 0);

                                                        return (
                                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className='fill-foreground text-3xl font-semibold'
                                                                >
                                                                    {total}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy ?? 0) + 24}
                                                                    className='fill-muted-foreground text-sm'
                                                                >
                                                                    Total Pengguna
                                                                </tspan>
                                                            </text>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            {roleChartData.map((entry: RoleChartDatum) => (
                                                <Cell key={entry.key} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
