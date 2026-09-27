import { TerminalOutput } from "../components/terminal-output";
import { readAgentOutput } from "../herdr/agent";
import { presentation } from "../herdr/status";
import { Agent } from "../herdr/types";

type Props = {
  agent: Agent;
};

export function AgentOutput({ agent }: Props) {
  const status = presentation(agent.status);

  return (
    <TerminalOutput
      navigationTitle={agent.title}
      target={agent.paneId}
      read={readAgentOutput}
      status={{ label: status.label, color: status.color }}
      rows={[
        { title: "Agent", text: agent.name ?? agent.kind },
        { title: "Directory", text: agent.cwd },
      ]}
    />
  );
}
