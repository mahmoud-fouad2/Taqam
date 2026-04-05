import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div tw="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b1220] to-[#0f172a] text-white">
        <div tw="absolute inset-0 flex">
          <div tw="absolute left-[130px] top-[95px] h-44 w-44 rounded-full bg-green-500/20" />
          <div tw="absolute right-[150px] top-[85px] h-40 w-40 rounded-full bg-blue-500/20" />
          <div tw="absolute bottom-[55px] right-[180px] h-48 w-48 rounded-full bg-purple-500/20" />
        </div>

        <div tw="relative flex h-[470px] w-[1040px] flex-col justify-between rounded-[32px] border border-white/10 bg-[#0a1627]/75 p-[52px]">
          <div tw="flex items-center gap-4">
            <div tw="flex h-[52px] w-[52px] rounded-2xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
            <div tw="flex flex-col">
              <div tw="text-[40px] font-extrabold leading-tight">Taqam | طاقم</div>
              <div tw="text-[18px] text-white/85">HR • Payroll • Attendance</div>
            </div>
          </div>

          <div tw="flex flex-col gap-3">
            <div tw="text-[46px] font-extrabold leading-tight">HR & Payroll for Saudi businesses</div>
            <div tw="max-w-[860px] text-[24px] leading-snug text-white/90">
              Employees, attendance, payroll, reports — Arabic/English and multi-tenant.
            </div>
          </div>

          <div tw="flex justify-between text-[16px] text-white/75">
            <div>taqam.net</div>
            <div>Request a demo</div>
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
