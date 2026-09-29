# ADR-0002: Provider-neutral execution

## Status
Accepted

## Decision
The core routes abstract capabilities, not brands or model names. Google Labs, Gemini, OpenAI, Claude, browser automation, MCP servers and internal workers are execution providers behind capability contracts.

## Consequence
A provider can fail, disappear or regress without redefining company strategy or the persisted company state model.
