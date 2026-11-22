#!/usr/bin/env python3
"""Deploy the Docker Hub release through OCI Run Command, without public SSH."""

import argparse
import os
import re
import sys
import time

import oci


TERMINAL_STATES = {"SUCCEEDED", "FAILED", "TIMED_OUT", "CANCELED"}


def client_from_environment() -> oci.compute_instance_agent.ComputeInstanceAgentClient:
    config = {
        "user": os.environ["OCI_USER_OCID"],
        "fingerprint": os.environ["OCI_FINGERPRINT"],
        "key_file": os.environ["OCI_PRIVATE_KEY_PATH"],
        "tenancy": os.environ["OCI_TENANCY_OCID"],
        "region": os.environ["OCI_REGION"],
    }
    oci.config.validate_config(config)
    return oci.compute_instance_agent.ComputeInstanceAgentClient(config)


def deployment_script(tag: str) -> str:
    if not re.fullmatch(r"sha-[0-9a-f]{40}", tag):
        raise ValueError("Deployment tag must be sha- followed by a full commit SHA")
    return f"""#!/usr/bin/env bash
set -Eeuo pipefail
sudo -n /usr/local/sbin/portafolio-release {tag.removeprefix('sha-')}
"""


def run_command(
    client: oci.compute_instance_agent.ComputeInstanceAgentClient,
    compartment_id: str,
    instance_id: str,
    script: str,
    display_name: str,
) -> None:
    model = oci.compute_instance_agent.models
    details = model.CreateInstanceAgentCommandDetails(
        compartment_id=compartment_id,
        execution_time_out_in_seconds=1800,
        display_name=display_name,
        target=model.InstanceAgentCommandTarget(instance_id=instance_id),
        content=model.InstanceAgentCommandContent(
            source=model.InstanceAgentCommandSourceViaTextDetails(text=script),
            output=model.InstanceAgentCommandOutputViaTextDetails(),
        ),
    )
    command_id = client.create_instance_agent_command(details).data.id
    print(f"OCI Run Command created: {command_id}", flush=True)

    deadline = time.monotonic() + 1860
    last_state = None
    while time.monotonic() < deadline:
        execution = client.get_instance_agent_command_execution(command_id, instance_id).data
        if execution.lifecycle_state != last_state:
            print(f"OCI execution: {execution.lifecycle_state}", flush=True)
            last_state = execution.lifecycle_state
        if execution.lifecycle_state in TERMINAL_STATES:
            content = execution.content
            if content and getattr(content, "text", None):
                print(content.text)
            if content and getattr(content, "message", None):
                print(content.message)
            if execution.lifecycle_state != "SUCCEEDED" or getattr(content, "exit_code", 1) != 0:
                raise RuntimeError(f"OCI Run Command failed: {execution.lifecycle_state}")
            return
        time.sleep(8)
    raise TimeoutError("Timed out waiting for OCI Run Command")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--instance-id", required=True)
    parser.add_argument("--compartment-id", required=True)
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--tag")
    args = parser.parse_args()
    if args.probe == bool(args.tag):
        parser.error("Specify exactly one of --probe or --tag")
    script = (
        "#!/usr/bin/env bash\nset -euo pipefail\necho run-command-ok\nid -u\n"
        if args.probe
        else deployment_script(args.tag)
    )
    run_command(
        client_from_environment(),
        args.compartment_id,
        args.instance_id,
        script,
        "Portafolio probe" if args.probe else f"Portafolio deploy {args.tag}",
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
