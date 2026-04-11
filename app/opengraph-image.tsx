import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div tw="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b1220] to-[#0f172a] text-white">
      <div tw="absolute inset-0 flex">
        <div tw="absolute left-[120px] top-[90px] h-48 w-48 rounded-full bg-green-500/20" />
        <div tw="absolute right-[130px] top-[70px] h-44 w-44 rounded-full bg-blue-500/20" />
        <div tw="absolute bottom-[80px] right-[200px] h-52 w-52 rounded-full bg-purple-500/20" />
      </div>

      <div tw="relative flex h-[510px] w-[1040px] flex-col justify-between rounded-[32px] border border-white/10 bg-[#0a1627]/75 p-14">
        <div tw="flex items-center gap-4">
          <div tw="flex h-14 w-14 rounded-2xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
          <div tw="flex flex-col">
            <div tw="text-[42px] font-extrabold leading-tight">Taqam | طاقم</div>
            <div tw="text-[20px] text-white/85">HR • Payroll • Attendance</div>
          </div>
        </div>

        <div tw="flex flex-col gap-3">
          <div tw="text-[48px] font-extrabold leading-tight">منصة موارد بشرية ورواتب</div>
          <div tw="max-w-[820px] text-[26px] leading-snug text-white/90">
            إدارة الموظفين، الحضور، الرواتب، وتقارير احترافية — عربي/إنجليزي ومتعدد الشركات.
          </div>
        </div>

        <div tw="flex items-center justify-between text-[18px] text-white/90">
          <div tw="flex gap-3">
            <div tw="rounded-full border border-green-500/25 bg-green-500/12 px-[14px] py-[10px]">
              Multi-tenant
            </div>
            <div tw="rounded-full border border-blue-500/25 bg-blue-500/12 px-[14px] py-[10px]">
              Saudi-ready
            </div>
            <div tw="rounded-full border border-purple-500/25 bg-purple-500/12 px-[14px] py-[10px]">
              Secure
            </div>
          </div>
          <div tw="text-white/70">taqam.net</div>
        </div>
      </div>
    </div>,
    {
      width: size.width,
      height: size.height
    }
  );
}
