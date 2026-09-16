/** Representative crew-tasks DAG (same shape as scout config/tasks.yaml), embedded to stay offline. */
export const crewTasksDemoYaml = `# imagoro demo crew DAG (scout tasks.yaml shape)
transcribe_task:
  description: >
    Convert the raw audio capture into a clean text transcript.
  expected_output: >
    A single transcript string.
  agent: capture_specialist

alert_task:
  description: >
    Analyze the transcript for active or planned enforcement.
  expected_output: >
    IGNORE or a single ALERT sentence with verbatim locations.
  agent: alert_specialist
  context:
    - transcribe_task

vet_task:
  description: >
    Vet the proposed alert against the original transcript.
  expected_output: >
    Exactly one token: VET_PASS or VET_FAIL.
  agent: vet_specialist
  context:
    - alert_task

intel_task:
  description: >
    Extract structured dispatch intel from the transcript.
  expected_output: >
    A single JSON intel object.
  agent: intel_specialist
  context:
    - transcribe_task

rank_task:
  description: >
    Rank scanner channel candidates for the driver.
  expected_output: >
    Compact JSON ranking with scores.
  agent: rank_specialist

core_task:
  description: >
    Combine all specialist outputs into the driver package.
  expected_output: >
    One JSON package with nav/chat/alert/vet/intel/channels.
  agent: core_specialist
  context:
    - alert_task
    - vet_task
    - intel_task
    - rank_task
`;