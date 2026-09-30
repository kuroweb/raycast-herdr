import { Icon, MenuBarExtra, open, openCommandPreferences } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { agentTitle, listAgents } from "./herdr/agent";
import { openHerdr } from "./herdr/launch";
import { describeError } from "./herdr/errors";
import { attentionCount, dominantStatus, groupByStatus, presentation } from "./herdr/status";
import { terminalAppPath } from "./herdr/preferences";
import { focusAgentAndReveal } from "./herdr/terminal";

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(listAgents, [], { initialData: [] });
  const agents = data ?? [];

  if (error) {
    return (
      <MenuBarExtra icon={{ source: Icon.Warning }} isLoading={isLoading} tooltip="Herdr">
        <MenuBarExtra.Item title={describeError(error)} />
        <MenuBarExtra.Item title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
        <MenuBarExtra.Item title="再試行" icon={Icon.ArrowClockwise} onAction={revalidate} />
        <MenuBarExtra.Item title="設定を開く" icon={Icon.Gear} onAction={openCommandPreferences} />
      </MenuBarExtra>
    );
  }

  const attention = attentionCount(agents);
  const dominant = dominantStatus(agents);
  const icon = dominant
    ? { source: presentation(dominant).icon, tintColor: presentation(dominant).color }
    : Icon.Circle;

  return (
    <MenuBarExtra
      icon={icon}
      // 0件のときにタイトルを出すとメニューバーを無駄に占有するので、要対応件数だけ出す。
      title={attention > 0 ? String(attention) : undefined}
      isLoading={isLoading}
      tooltip={`Herdr: ${agents.length} agents`}
    >
      {agents.length === 0 ? (
        <MenuBarExtra.Item title="稼働中のagentがありません" />
      ) : (
        groupByStatus(agents).map(({ status, agents: grouped }) => (
          <MenuBarExtra.Section key={status} title={`${presentation(status).label} (${grouped.length})`}>
            {grouped.map((agent) => (
              <MenuBarExtra.Item
                key={agent.paneId}
                icon={{ source: presentation(agent.status).icon, tintColor: presentation(agent.status).color }}
                title={agentTitle(agent)}
                subtitle={agent.name ?? agent.kind}
                onAction={() => focusAgentAndReveal(agent)}
              />
            ))}
          </MenuBarExtra.Section>
        ))
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Agents一覧を開く"
          icon={Icon.List}
          onAction={() => open("raycast://extensions/kuroweb/herdr/agents")}
        />
        <MenuBarExtra.Item
          title="Spaces一覧を開く"
          icon={Icon.AppWindowGrid2x2}
          onAction={() => open("raycast://extensions/kuroweb/herdr/spaces")}
        />
        <MenuBarExtra.Item title="Herdrを開く" icon={Icon.Terminal} onAction={() => openHerdr()} />
        <MenuBarExtra.Item title="更新" icon={Icon.ArrowClockwise} onAction={revalidate} />
        {terminalAppPath() === undefined ? (
          <MenuBarExtra.Item title="Terminal Appを設定する" icon={Icon.Gear} onAction={openCommandPreferences} />
        ) : null}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
