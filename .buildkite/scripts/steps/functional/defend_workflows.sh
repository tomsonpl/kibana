#!/usr/bin/env bash

set -euo pipefail

source .buildkite/scripts/steps/functional/common.sh

export JOB=kibana-defend-workflows-cypress
export KIBANA_INSTALL_DIR=${KIBANA_BUILD_LOCATION}

echo "--- Defend Workflows Cypress tests"

for version in $(cat versions.json | jq -r '.versions[].version'); do
  node x-pack/plugins/security_solution/scripts/endpoint/agent_downloader --version "$version"
done

cd x-pack/plugins/security_solution

set +e
BK_ANALYTICS_API_KEY=$(vault_get security-solution-ci defend-workflows-bk-api-key)

BK_ANALYTICS_API_KEY=$BK_ANALYTICS_API_KEY yarn cypress:dw:run; status=$?; yarn junit:merge || :; exit $status
