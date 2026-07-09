"use client";

import { GrassMap, Section, Divider } from "@m1kapp/kit";
import { useAccent } from "@/lib/theme-context";
import type { SiteData } from "./dashboard-view";
import { CumulativeCurve } from "./cumulative-curve";
import { OverviewInsights, CoachSection } from "./overview-insights";
import { RefreshOgButton, DeleteSiteButton } from "./dashboard-settings";
import { BadgeEditor } from "./badge-editor";
import { SectionNav, VerifiedStatus } from "./dashboard-chrome";

/** 통계 본문 — 섹션 내비 + 코치 + 누적/데일리 차트 + 인사이트 */
export function StatsSections({ data, hasCode }: { data: SiteData; hasCode: boolean }) {
  return (
    <>
      <SectionNav hasCoach={data.daily.length >= 3} data={data} hasCode={hasCode} />

      {data.daily.length >= 3 && (
        <div id="sec-coach">
          <Section className="py-5">
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2.5">1K 코치</p>
            <CoachSection data={data} />
          </Section>
          <Divider />
        </div>
      )}

      <div id="sec-cumulative">
        <Section className="py-5">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 누적</p>
          <CumulativeCurveWithAccent daily={data.daily} total={data.total} todayCount={data.todayCount} />
        </Section>
      </div>

      <Divider />

      <div id="sec-daily">
        <Section className="py-5">
          <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 데일리</p>
          <GrassMapWithAccent daily={data.daily} />
        </Section>
      </div>

      <Divider />

      <Section className="py-3">
        <OverviewInsights data={data} />
      </Section>
    </>
  );
}

/** 소유자 전용 관리 섹션 — 인증 상태·뱃지 수정·OG 갱신·삭제 */
export function OwnerSection({ data, host, showBadgeEditor, onToggleEditor }: {
  data: SiteData; host: string; showBadgeEditor: boolean; onToggleEditor: () => void;
}) {
  return (
    <>
      <Divider />
      <Section className="py-4">
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-3">관리</p>

        <VerifiedStatus
          verified={data.verified}
          showEditor={showBadgeEditor}
          onToggleEditor={onToggleEditor}
          isOwner
        />

        {data.verified && showBadgeEditor && (
          <div className="mt-3">
            <BadgeEditor slug={data.slug} host={host} savedStyle={data.badgeStyle} savedColor={data.badgeColor} />
          </div>
        )}

        <div className="mt-3 space-y-0">
          <RefreshOgButton slug={data.slug} />
          <DeleteSiteButton slug={data.slug} />
        </div>
      </Section>
    </>
  );
}
function CumulativeCurveWithAccent({ daily, total, todayCount }: { daily: { date: string; count: number }[]; total: number; todayCount: number }) {
  const { accent } = useAccent();
  return <CumulativeCurve daily={daily} total={total} todayCount={todayCount} accent={accent} />;
}

function GrassMapWithAccent({ daily }: { daily: { date: string; count: number }[] }) {
  const { accent, isDark } = useAccent();
  return <GrassMap data={daily} accent={accent} isDark={isDark} unit="명" />;
}
