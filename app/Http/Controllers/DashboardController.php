<?php

namespace App\Http\Controllers;

use App\Data\Dashboard\DashboardData;
use App\Data\Dashboard\DashboardUploadStatsData;
use App\Models\DigitalEvidence;
use App\Models\SocialMediaEvidence;
use App\Services\GoogleDrive\DriveClient;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller {
    public function __invoke(Request $request, DriveClient $driveClient): Response {
        $user = $request->user();

        $now = Carbon::now();
        $monthLabel = $now->copy()->locale('id')->translatedFormat('F Y');
        $startOfMonth = $now->copy()->startOfMonth();

        $digitalTotal = DigitalEvidence::query()->count();
        $digitalThisMonth = DigitalEvidence::query()
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->count();

        $socialTotal = SocialMediaEvidence::query()->count();
        $socialThisMonth = SocialMediaEvidence::query()
            ->whereBetween('created_at', [$startOfMonth, $now])
            ->count();

        $mineDigitalTotal = $user
            ? DigitalEvidence::query()->where('user_id', $user->getKey())->count()
            : 0;
        $mineDigitalThisMonth = $user
            ? DigitalEvidence::query()
                ->where('user_id', $user->getKey())
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->count()
            : 0;

        $mineSocialTotal = $user
            ? SocialMediaEvidence::query()->where('user_id', $user->getKey())->count()
            : 0;
        $mineSocialThisMonth = $user
            ? SocialMediaEvidence::query()
                ->where('user_id', $user->getKey())
                ->whereBetween('created_at', [$startOfMonth, $now])
                ->count()
            : 0;

        $firstName = $user?->name
            ? Str::of($user->name)->trim()->explode(' ')->filter()->first()
            : null;

        if (!$firstName && $user?->username) {
            $firstName = (string) Str::of($user->username)->trim();
        }

        $greetingName = $firstName ?: 'Tim';
        $greeting = sprintf('Selamat datang, %s!', $greetingName);
        $description = 'Unggah evidence digital dan medsos langsung dari dasbor.';

        $overview = new DashboardData(
            greeting: $greeting,
            description: $description,
            current_month_label: $monthLabel,
            digital: new DashboardUploadStatsData(
                total: $digitalTotal,
                this_month: $digitalThisMonth,
                mine_total: $mineDigitalTotal,
                mine_this_month: $mineDigitalThisMonth,
            ),
            social: new DashboardUploadStatsData(
                total: $socialTotal,
                this_month: $socialThisMonth,
                mine_total: $mineSocialTotal,
                mine_this_month: $mineSocialThisMonth,
            ),
            drive_enabled: $driveClient->isEnabled(),
        );

        return Inertia::render('dashboard', [
            'overview' => $overview,
        ]);
    }
}
