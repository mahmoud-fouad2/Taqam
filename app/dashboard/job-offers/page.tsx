import { JobOffersManager } from "./job-offers-manager";

export default function JobOffersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">العروض الوظيفية</h1>
          <p className="text-muted-foreground">إدارة عروض التوظيف ومتابعة حالتها</p>
        </div>
      </div>
      <JobOffersManager />
    </div>
  );
}
