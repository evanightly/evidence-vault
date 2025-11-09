declare namespace App.Data.Dashboard {
export type CountByLabelData = {
label: string;
count: number;
};
export type DashboardData = {
greeting: string;
description: string;
current_month_label: string;
digital: any;
social: any;
drive_enabled: boolean;
};
export type DashboardFilterData = {
date_from: string | null;
date_to: string | null;
};
export type DashboardTotalsData = {
total_logs: number;
active_employees: number | null;
total_employees: number | null;
};
export type DashboardUploadStatsData = {
total: number;
this_month: number;
mine_total: number;
mine_this_month: number;
};
}
declare namespace App.Data.DigitalEvidence {
export type DigitalEvidenceData = {
id: any | number;
name: string | null;
filepath: string | null;
created_at: string | null;
updated_at: string | null;
user: any;
};
}
declare namespace App.Data.Logbook {
export type LogbookData = {
id: any | number;
date: string | null;
additional_notes: string | null;
created_at: string | null;
updated_at: string | null;
technician: any;
work_location: any;
shift: any;
work_details: any;
evidences: any;
drive_folder_id: string | null;
drive_folder_url: string | null;
drive_published_at: string | null;
};
}
declare namespace App.Data.LogbookEvidence {
export type LogbookEvidenceData = {
id: any | number;
filepath: string | null;
filename: string | null;
url: string | null;
created_at: string | null;
updated_at: string | null;
logbook: any;
};
}
declare namespace App.Data.LogbookWorkDetail {
export type LogbookWorkDetailData = {
id: any | number;
description: string | null;
created_at: string | null;
updated_at: string | null;
logbook: any;
};
}
declare namespace App.Data.Shift {
export type ShiftData = {
id: any | number;
work_location_id: number;
name: string | null;
start_time: string | null;
end_time: string | null;
start_time_label: string | null;
end_time_label: string | null;
time_range_label: string | null;
created_at: string | null;
updated_at: string | null;
};
}
declare namespace App.Data.SocialMediaEvidence {
export type SocialMediaEvidenceData = {
id: any | number;
name: string | null;
filepath: string | null;
created_at: string | null;
updated_at: string | null;
user: any;
};
}
declare namespace App.Data.User {
export type UserData = {
id: any | number;
name: string | null;
username: string | null;
email: string | null;
role: string | null;
digital_evidence_count: any | number;
social_media_evidence_count: any | number;
total_evidence_count: any | number;
created_at: string | null;
updated_at: string | null;
formatted_created_at: string | null;
formatted_updated_at: string | null;
};
}
declare namespace App.Data.WorkLocation {
export type WorkLocationData = {
id: any | number;
name: string | null;
shifts_count: any | number;
shifts: any;
created_at: string | null;
updated_at: string | null;
};
}
declare namespace App.Services.Evidence {
export enum EvidenceType { Digital = 'digital', Social = 'social' };
}
declare namespace App.Support {
export enum RoleEnum { SuperAdmin = 'SuperAdmin', Admin = 'Admin', Employee = 'Employee' };
}
